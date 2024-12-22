import { NestedStack, RemovalPolicy } from "aws-cdk-lib";
import { AppProtocol, AwsLogDriverMode, Compatibility, ContainerImage, CpuArchitecture, LogDriver, NetworkMode, OperatingSystemFamily, Protocol, Secret, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { DifyTaskDefinitionStackProps } from "./props";

export class DifyApiTaskDefinitionStack extends NestedStack {

    static readonly DIFY_API_PORT = 5001

    static readonly HEALTHY_ENDPOINT = "/health"

    public readonly definition: TaskDefinition

    constructor(scope: Construct, id: string, props: DifyTaskDefinitionStackProps) {
        super(scope, id, props);

        const taskRole = new Role(this, 'ServerlessDifyClusterApiTaskRole', {
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [{ managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' }]
        })

        this.definition = new TaskDefinition(this, 'DifyApiTaskDefinitionStack', {
            family: "serverless-dify-api",
            taskRole: taskRole,
            executionRole: taskRole,
            compatibility: Compatibility.EC2_AND_FARGATE,
            networkMode: NetworkMode.AWS_VPC,
            runtimePlatform: {
                operatingSystemFamily: OperatingSystemFamily.LINUX,
                cpuArchitecture: CpuArchitecture.ARM64
            },
            cpu: '1024',
            memoryMiB: '2048',
        })

        this.definition.addContainer('api', {
            containerName: "main",
            essential: true,
            image: ContainerImage.fromRegistry("langgenius/dify-api"),
            cpu: 512,
            memoryLimitMiB: 1024,
            portMappings: [
                {
                    containerPort: DifyApiTaskDefinitionStack.DIFY_API_PORT,
                    hostPort: DifyApiTaskDefinitionStack.DIFY_API_PORT,
                    name: "serverless-dify-api-5001-tcp",
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

                "CODE_MIN_NUMBER": "-9223372036854775808",
                "CODE_MAX_STRING_LENGTH": "80000",
                "CODE_MAX_STRING_ARRAY_LENGTH": "30",
                "CODE_MAX_OBJECT_ARRAY_LENGTH": "30",
                "CODE_MAX_NUMBER_ARRAY_LENGTH": "1000",
                "CODE_MAX_NUMBER": "9223372036854775807",

                "CODE_EXECUTION_ENDPOINT": "http://localhost:8194",

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

        this.definition.addContainer('sandbox', {
            containerName: "sandbox",
            image: ContainerImage.fromRegistry("langgenius/dify-sandbox"),
            portMappings: [
                { containerPort: 8194, hostPort: 8194, name: "serverless-dify-sandbox-8194-tcp", appProtocol: AppProtocol.http, protocol: Protocol.TCP }
            ],
            cpu: 512,
            memoryLimitMiB: 1024,
            logging: LogDriver.awsLogs({
                streamPrefix: 'sandbox',
                mode: AwsLogDriverMode.NON_BLOCKING,
                logGroup: new LogGroup(this, 'DifySandboxLogGroup', {
                    retention: RetentionDays.ONE_WEEK,
                    removalPolicy: RemovalPolicy.DESTROY,
                    logGroupName: '/ecs/serverless-dify/sandbox'
                }),
            }),
            environment: {
                'GIN_MODE': 'release',
                'WORKER_TIMEOUT': '15',

                "MAIL_TYPE": "smtp",
                "SMTP_SERVER": props.stmp.host,
                "SMTP_PORT": props.stmp.port.toString(),
                "SMTP_USERNAME": props.stmp.username,
                "SMTP_PASSWORD": props.stmp.password,
                "SMTP_USE_TLS": props.stmp.tls ? "true" : "false",
                "MAIL_FROM_ADDRESS": props.stmp.fromEmail,
            },
            secrets: {
                "API_KEY": Secret.fromSecretsManager(props.sandboxCodeExecutionKey)
            }
        })
    }
}