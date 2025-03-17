import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { AuroraPostgresEngineVersion, ClusterInstance, Credentials, DatabaseCluster, DatabaseClusterEngine, SubnetGroup } from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { InvocationType } from "aws-cdk-lib/triggers";
import { Construct } from "constructs";
import { DifyMetadataStoreProps } from "./task-definitions/props";
import path = require("path");


export interface MetadataStoreStackProps extends StackProps {

    vpc: Vpc

    sg: SecurityGroup

}


export class MetadataStoreStack extends Stack {

    public readonly cluster: DatabaseCluster

    public readonly secret: Secret

    static readonly PORT: number = 5432

    static readonly DEFAULT_DATABASE: string = "dify"

    static readonly DEFAULT_PLUGIN_DATABASE: string = "dify_plugin"

    private readonly sqlExecFunction: Function

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
            // enableDataApi: true,
            credentials: Credentials.fromSecret(this.secret),
            defaultDatabaseName: MetadataStoreStack.DEFAULT_DATABASE,
        })

        this.sqlExecFunction = new NodejsFunction(this, 'MetadataStoreSqlExecFunction', {
            runtime: Runtime.NODEJS_LATEST,
            handler: 'index.handler',
            memorySize: 256,
            environment: { SECRET_ARN: this.secret.secretArn },
            code: Code.fromAsset(path.join(__dirname, './aurorapg-run-query/')),
            securityGroups: [props.sg],
            vpc: props.vpc,
            vpcSubnets: props.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
            logRetention: RetentionDays.ONE_DAY
        })

        this.cluster.applyRemovalPolicy(RemovalPolicy.DESTROY)

        const query = this.createDifyPluginDatabase()
        this.cluster.secret?.grantRead(query)
        query.node.addDependency(this.cluster)
    }

    private createDifyPluginDatabase() {
        const query = new AwsCustomResource(this, 'CreateDifyPluginDatabase', {
            onUpdate: {
                service: 'Lambda',
                action: 'invoke',
                parameters: {
                    FunctionName: this.sqlExecFunction.functionArn,
                    InvocationType: InvocationType.REQUEST_RESPONSE,
                    Payload: JSON.stringify({
                        query: `CREATE DATABASE IF NOT EXISTS ${MetadataStoreStack.DEFAULT_PLUGIN_DATABASE};`
                    }),
                },
                physicalResourceId: PhysicalResourceId.of('CreateDifyPluginDatabase')
            },
            policy: AwsCustomResourcePolicy.fromStatements([
                new PolicyStatement({
                    effect: Effect.ALLOW,
                    actions: ['lambda:InvokeFunction'],
                    resources: [this.sqlExecFunction.functionArn]
                })
            ])
        })

        return query
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