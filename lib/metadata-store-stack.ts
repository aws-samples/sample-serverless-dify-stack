import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { AuroraPostgresEngineVersion, ClusterInstance, Credentials, DatabaseCluster, DatabaseClusterEngine, SubnetGroup } from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { DifyMetadataStoreProps } from "./task-definitions/props";


export interface MetadataStoreStackProps extends StackProps {

    vpc: Vpc

    sg: SecurityGroup

}


export class MetadataStoreStack extends Stack {

    public readonly cluster: DatabaseCluster

    public readonly secret: Secret

    static readonly PORT: number = 5432

    static readonly DEFAULT_DATABASE: string = "dify"

    constructor(scope: Construct, id: string, props: MetadataStoreStackProps) {
        super(scope, id, props)

        const subnetGroup = new SubnetGroup(this, "MetadataStoreSubnetGroup", {
            description: 'Used for serverless-dify metadata store',
            vpc: props.vpc,
            removalPolicy: RemovalPolicy.DESTROY,
            vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        });

        this.secret = new Secret(this, "MetadataStoreDatabaseSecret", {
            description: "Used for serverless-dify metadata store",
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: "postgre" }),
                generateStringKey: "password",
                excludePunctuation: true
            }
        })

        this.cluster = new DatabaseCluster(this, 'MetadataStoreDatabaseCluster', {
            vpc: props.vpc,
            securityGroups: [props.sg],
            port: MetadataStoreStack.PORT,
            subnetGroup: subnetGroup,
            clusterIdentifier: 'serverless-dify-metadata-store',
            engine: DatabaseClusterEngine.auroraPostgres({ version: AuroraPostgresEngineVersion.VER_15_4 }),
            writer: ClusterInstance.serverlessV2('MetadataStoreServerlessWriteInstance'),
            cloudwatchLogsRetention: RetentionDays.ONE_WEEK,
            serverlessV2MinCapacity: 0.5,
            serverlessV2MaxCapacity: 2,
            iamAuthentication: true,
            enableDataApi: true,
            credentials: Credentials.fromSecret(this.secret),
            defaultDatabaseName: MetadataStoreStack.DEFAULT_DATABASE,
        })

        this.cluster.applyRemovalPolicy(RemovalPolicy.DESTROY)
    }


    public exportProps(): DifyMetadataStoreProps {
        return {
            hostname: this.cluster.clusterEndpoint.hostname,
            port: MetadataStoreStack.PORT,
            defaultDatabase: MetadataStoreStack.DEFAULT_DATABASE,
            secret: this.secret
        }
    }

}