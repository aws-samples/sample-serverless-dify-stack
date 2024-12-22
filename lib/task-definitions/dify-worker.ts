import { NestedStack, RemovalPolicy } from "aws-cdk-lib";
import { AwsLogDriverMode, Compatibility, ContainerImage, CpuArchitecture, LogDriver, NetworkMode, OperatingSystemFamily, Secret, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { DifyTaskDefinitionStackProps } from "./props";

export class DifyWorkerTaskDefinitionStack extends NestedStack {

    public readonly definition: TaskDefinition;

    constructor(scope: Construct, id: string, props: DifyTaskDefinitionStackProps) {
        super(scope, id, props);

        const taskRole = new Role(this, 'ServerlessDifyClusterWorkerTaskRole', {
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [{ managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' }]
        })

        this.definition = new TaskDefinition(this, 'DifyWorkerTaskDefinitionStack', {
            family: "serverless-dify-worker",
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

        this.definition.addContainer('worker', {
            containerName: "worker",
            essential: true,
            image: ContainerImage.fromRegistry('langgenius/dify-api'),
            command: ['worker'],
            cpu: 512,
            memoryLimitMiB: 1024,
            environment: {

                "MODE": "worker",
                "LOG_LEVEL": "INFO",
                "EDITION": "SELF_HOSTED",
                "DEPLOY_ENV": "PRODUCTION",
                "MIGRATION_ENABLED": "true",

                "APP_WEB_URL": "",
                "APP_API_URL": "",
                "CONSOLE_API_URL": "",
                "SERVICE_API_URL": "",
                "CONSOLE_WEB_URL": "",

                "CODE_MIN_NUMBER": "-9223372036854775808",
                "CODE_MAX_STRING_LENGTH": "80000",
                "CODE_MAX_STRING_ARRAY_LENGTH": "30",
                "CODE_MAX_OBJECT_ARRAY_LENGTH": "30",
                "CODE_MAX_NUMBER_ARRAY_LENGTH": "1000",
                "CODE_MAX_NUMBER": "9223372036854775807",

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
                "REDIS_PORT": props.redis.port.toString(),
                "REDIS_DB": "0",
                "REDIS_USE_SSL": "true",

                "STORAGE_TYPE": "s3",
                "S3_REGION": this.region,
                "S3_BUCKET_NAME": props.fileStore.bucket.bucketName,
                "S3_USE_AWS_MANAGED_IAM": "true",

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
            logging: LogDriver.awsLogs({
                streamPrefix: 'api',
                mode: AwsLogDriverMode.NON_BLOCKING,
                logGroup: new LogGroup(this, 'DifyWorkerLogGroup', {
                    retention: RetentionDays.ONE_WEEK,
                    removalPolicy: RemovalPolicy.DESTROY,
                    logGroupName: '/ecs/serverless-dify/worker'
                }),
            }),

        })
    }

}