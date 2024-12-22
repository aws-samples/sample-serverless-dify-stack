import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { AuroraPostgresEngineVersion, ClusterInstance, Credentials, DatabaseCluster, DatabaseClusterEngine, SubnetGroup } from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { DifyVectorStorePgProps } from "./task-definitions/props";

export interface VectorStoreStackProps extends StackProps {

    vpc: Vpc

    sg: SecurityGroup
}

export class VectorStoreStack extends Stack {

    static readonly PORT: number = 5432

    static readonly DEFAULT_DATABASE: string = 'dify'

    public readonly cluster: DatabaseCluster

    public readonly secret: Secret

    constructor(scope: Construct, id: string, props: VectorStoreStackProps) {
        super(scope, id, props)

        const subnetGroup = new SubnetGroup(this, "VectorStoreSubnetGroup", {
            description: 'Used for serverless-dify vector store',
            vpc: props.vpc,
            removalPolicy: RemovalPolicy.DESTROY,
            vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        });

        this.secret = new Secret(this, "VectorStoreDatabaseSecret", {
            description: "Used for serverless-dify vector store",
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: "XXXXXXX" }),
                generateStringKey: "password",
                excludePunctuation: true
            }
        })

        this.cluster = new DatabaseCluster(this, 'VectorStoreDatabaseCluster', {
            vpc: props.vpc,
            securityGroups: [props.sg],
            port: VectorStoreStack.PORT,
            subnetGroup: subnetGroup,
            clusterIdentifier: 'serverless-dify-vector-store',
            engine: DatabaseClusterEngine.auroraPostgres({ version: AuroraPostgresEngineVersion.VER_15_6 }),
            writer: ClusterInstance.serverlessV2("DifyVectorStore"),
            cloudwatchLogsRetention: RetentionDays.ONE_WEEK,
            serverlessV2MinCapacity: 0.5,
            serverlessV2MaxCapacity: 2,
            iamAuthentication: true,
            enableDataApi: true,
            credentials: Credentials.fromSecret(this.secret),
            defaultDatabaseName: VectorStoreStack.DEFAULT_DATABASE
        })

        const query = this.enablePgvectorExtension()
        this.cluster.secret?.grantRead(query)
        this.cluster.grantDataApiAccess(query)
        query.node.addDependency(this.cluster)
    }


    private enablePgvectorExtension() {
        const query = new AwsCustomResource(this, 'Query-EnablePgvectorExtension', {
            onCreate: {
                service: 'RDSDataService',
                action: 'executeStatement',
                parameters: {
                    resourceArn: this.cluster.clusterArn,
                    secretArn: this.cluster.secret?.secretArn,
                    database: VectorStoreStack.DEFAULT_DATABASE,
                    sql: 'CREATE EXTENSION IF NOT EXISTS vector;'
                },
                physicalResourceId: PhysicalResourceId.of(this.cluster.clusterArn)
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: [this.cluster.clusterArn] })
        })

        return query
    }

    public exportProps(): DifyVectorStorePgProps {
        return {
            hostname: this.cluster.clusterEndpoint.hostname,
            port: VectorStoreStack.PORT,
            defaultDatabase: VectorStoreStack.DEFAULT_DATABASE,
            secret: this.secret
        }
    }
}
