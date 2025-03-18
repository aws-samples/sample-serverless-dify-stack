import { Duration, NestedStack, RemovalPolicy } from "aws-cdk-lib";
import { AppProtocol, AwsLogDriverMode, Compatibility, ContainerImage, CpuArchitecture, LogDriver, NetworkMode, OperatingSystemFamily, Protocol, Secret, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { DifyStack } from "../dify-stack";
import { DifySandboxTaskDefinitionStack } from "./dify-sandbox";
import { DifyTaskDefinitionStackProps } from "./props";

export class DifyApiTaskDefinitionStack extends NestedStack {

    static readonly DIFY_API_PORT = 5001

    static readonly HEALTHY_ENDPOINT = "/health"

    static readonly API_PORT_MAPPING_NAME = "serverless-dify-api-5001-tcp"

    public readonly definition: TaskDefinition

    constructor(scope: Construct, id: string, props: DifyTaskDefinitionStackProps) {
        super(scope, id, props);

        const taskRole = new Role(this, 'ServerlessDifyClusterApiTaskRole', {
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
        })
        taskRole.addToPrincipalPolicy(new PolicyStatement({
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock:Rerank',
                'bedrock:Retrieve',
                'bedrock:RetrieveAndGenerate',
            ],
            resources: ['*']
        }))
        taskRole.addToPolicy(new PolicyStatement({
            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: ['*']
        }))
        taskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPullOnly'))

        props.fileStore.bucket.grantReadWrite(taskRole)

        this.definition = new TaskDefinition(this, 'DifyApiTaskDefinitionStack', {
            family: "serverless-dify-api",
            taskRole: taskRole,
            executionRole: taskRole,
            compatibility: Compatibility.EC2_AND_FARGATE,
            networkMode: NetworkMode.AWS_VPC,
            runtimePlatform: {
                operatingSystemFamily: OperatingSystemFamily.LINUX,
                cpuArchitecture: CpuArchitecture.X86_64
            },
            cpu: '1024',
            memoryMiB: '2048',
        })

        this.definition.addContainer('api', {
            containerName: "main",
            essential: true,
            image: ContainerImage.fromRegistry(props.difyImage.api),
            portMappings: [
                {
                    containerPort: DifyApiTaskDefinitionStack.DIFY_API_PORT,
                    hostPort: DifyApiTaskDefinitionStack.DIFY_API_PORT,
                    name: DifyApiTaskDefinitionStack.API_PORT_MAPPING_NAME,
                    appProtocol: AppProtocol.http, protocol: Protocol.TCP
                }
            ],
            logging: LogDriver.awsLogs({
                streamPrefix: 'api',
                mode: AwsLogDriverMode.NON_BLOCKING,
                logGroup: new LogGroup(this, 'DifyApiLogGroup', {
                    retention: RetentionDays.ONE_WEEK,
                    removalPolicy: RemovalPolicy.DESTROY,
                    logGroupName: '/ecs/serverless-dify/api'
                }),
            }),
            healthCheck: {
                command: ['CMD-SHELL', 'curl -f http://localhost:5001/health || exit 1'],
                interval: Duration.seconds(15),
                startPeriod: Duration.seconds(90),
                retries: 10,
                timeout: Duration.seconds(5)
            },
            environment: {

                "MODE": "api",
                "LOG_LEVEL": "INFO",
                "EDITION": "SELF_HOSTED",
                "DEPLOY_ENV": "PRODUCTION",
                "MIGRATION_ENABLED": "true",

                "SERVICE_API_URL": "",
                "CONSOLE_API_URL": "",
                "CONSOLE_WEB_URL": "",
                "APP_API_URL": "",
                "APP_WEB_URL": "",

                "MARKETPLACE_API_URL": 'https://marketplace.dify.ai',
                "MARKETPLACE_URL": 'https://marketplace.dify.ai',

                "CODE_MIN_NUMBER": "-9223372036854775808",
                "CODE_MAX_STRING_LENGTH": "80000",
                "CODE_MAX_STRING_ARRAY_LENGTH": "30",
                "CODE_MAX_OBJECT_ARRAY_LENGTH": "30",
                "CODE_MAX_NUMBER_ARRAY_LENGTH": "1000",
                "CODE_MAX_NUMBER": "9223372036854775807",

                // "CODE_EXECUTION_ENDPOINT": "http://localhost:8194",
                "CODE_EXECUTION_ENDPOINT": `http://${DifyStack.DIFY_SANDBOX_SERVICE_DNS_NAME}:${DifySandboxTaskDefinitionStack.DIFY_SANDBOX_PORT}`,

                "CELERY_BROKER_URL": "redis://" + props.celeryBroker.hostname + ":" + props.celeryBroker.port + "/0",
                "BROKER_USE_SSL": "true",

                "DB_HOST": props.metadataStore.hostname,
                "DB_PORT": props.metadataStore.port.toString(),
                "DB_DATABASE": props.metadataStore.defaultDatabase,

                "VECTOR_STORE": "pgvector",
                "PGVECTOR_HOST": props.vectorStore.hostname,
                "PGVECTOR_PORT": props.vectorStore.port.toString(),
                "PGVECTOR_DATABASE": props.vectorStore.defaultDatabase,

                "REDIS_HOST": props.redis.hostname,
                "REDIS_PORT": props.redis.port,
                "REDIS_USE_SSL": "true",
                "REDIS_DB": "0",

                "STORAGE_TYPE": "s3",
                "S3_BUCKET_NAME": props.fileStore.bucket.bucketName,
                "S3_REGION": this.region,
                "S3_USE_AWS_MANAGED_IAM": "true",

                "TEMPLATE_TRANSFORM_MAX_LENGTH": "80000",

                "MAIL_TYPE": "smtp",
                "SMTP_SERVER": props.stmp.host,
                "SMTP_PORT": props.stmp.port.toString(),
                "SMTP_USERNAME": props.stmp.username,
                "SMTP_PASSWORD": props.stmp.password,
                "SMTP_USE_TLS": props.stmp.tls ? "true" : "false",
                "MAIL_FROM_ADDRESS": props.stmp.fromEmail,
            },

            secrets: {
                "SECRET_KEY": Secret.fromSecretsManager(props.apiSecretKey),
                "CODE_EXECUTION_API_KEY": Secret.fromSecretsManager(props.sandboxCodeExecutionKey),
                "DB_USERNAME": Secret.fromSecretsManager(props.metadataStore.secret, "username"),
                "DB_PASSWORD": Secret.fromSecretsManager(props.metadataStore.secret, "password"),
                "PGVECTOR_USER": Secret.fromSecretsManager(props.vectorStore.secret, "username"),
                "PGVECTOR_PASSWORD": Secret.fromSecretsManager(props.vectorStore.secret, "password"),
            },
        })
    }
}