import { Secret } from "aws-cdk-lib/aws-ecs";
import { DifyStack } from "../dify-stack";
import { MetadataStoreStack } from "../metadata-store-stack";
import { VectorStoreStack } from "../vector-store-stack";
import { DifyApiTaskDefinitionStack } from "./dify-api";
import { DifyPluginDaemonTaskDefinitionStack } from "./dify-plugin-daemon";
import { DifySandboxTaskDefinitionStack } from "./dify-sandbox";
import { DifyTaskDefinitionStackProps } from "./props";

export class TaskEnvironments {

    static getSharedEnvironment(props: DifyTaskDefinitionStackProps, region: string): Record<string, string> {
        return {
            CONSOLE_API_URL: "",
            CONSOLE_WEB_URL: "",
            SERVICE_API_URL: "",
            APP_API_URL: "",
            APP_WEB_URL: "",
            FILES_URL: "",
            LOG_LEVEL: "INFO",
            LOG_FILE: "app/logs/server.log",
            LOG_FILE_MAX_SIZE: "20",
            LOG_FILE_BACKUP_COUNT: "5",
            LOG_DATEFORMAT: "%Y-%m-%d %H:%M:%S",
            LOG_TZ: "UTC",
            DEBUG: "false",
            FLASK_DEBUG: "false",
            INIT_PASSWORD: "",
            DEPLOY_ENV: "PRODUCTION",
            MIGRATION_ENABLED: "true",
            FILES_ACCESS_TIMEOUT: "300",
            ACCESS_TOKEN_EXPIRE_MINUTES: "60",
            REFRESH_TOKEN_EXPIRE_DAYS: "30",
            APP_MAX_ACTIVE_REQUESTS: "0",
            APP_MAX_EXECUTION_TIME: "1200",
            DIFY_BIND_ADDRESS: "0.0.0.0",
            DIFY_PORT: "5001",
            SERVER_WORKER_AMOUNT: "1",
            SERVER_WORKER_CLASS: "gevent",
            SERVER_WORKER_CONNECTIONS: "10",
            CELERY_WORKER_CLASS: "",
            GUNICORN_TIMEOUT: "360",
            CELERY_WORKER_AMOUNT: "",
            CELERY_AUTO_SCALE: "false",
            CELERY_MAX_WORKERS: "",
            CELERY_MIN_WORKERS: "",
            API_TOOL_DEFAULT_CONNECT_TIMEOUT: "10",
            API_TOOL_DEFAULT_READ_TIMEOUT: "60",
            SQLALCHEMY_POOL_SIZE: "30",
            SQLALCHEMY_POOL_RECYCLE: "3600",
            SQLALCHEMY_ECHO: "false",
            POSTGRES_MAX_CONNECTIONS: "100",
            POSTGRES_SHARED_BUFFERS: "128MB",
            POSTGRES_WORK_MEM: "4MB",
            POSTGRES_MAINTENANCE_WORK_MEM: "64MB",
            POSTGRES_EFFECTIVE_CACHE_SIZE: "4096MB",

            DB_DATABASE: MetadataStoreStack.DEFAULT_DATABASE,
            DB_PLUGIN_DATABASE: MetadataStoreStack.DEFAULT_PLUGIN_DATABASE,

            VECTOR_STORE: "pgvector",
            PGVECTOR_DATABASE: VectorStoreStack.DEFAULT_DATABASE,

            // REDIS_USERNAME:      // redis disabled auth
            // REDIS_PASSWORD:      // redis disabled auth
            REDIS_HOST: props.redis.hostname,
            REDIS_PORT: props.redis.port,
            REDIS_USE_SSL: "true",
            REDIS_DB: "0",

            CELERY_BROKER_URL: `redis://${props.celeryBroker.hostname}:${props.celeryBroker.port}/0`,
            BROKER_USE_SSL: "true",
            CELERY_USE_SENTINEL: "false",

            WEB_API_CORS_ALLOW_ORIGINS: "*",
            CONSOLE_CORS_ALLOW_ORIGINS: "*",

            AWS_REGION: region,

            STORAGE_TYPE: "s3",
            // S3_ENDPOINT: "",
            S3_REGION: region,
            S3_BUCKET_NAME: props.fileStore.bucket.bucketName,
            S3_USE_AWS_MANAGED_IAM: "true",
            S3_ENDPOINT: `https://s3.${region}.amazonaws.com`,

            MAIL_TYPE: "smtp",
            MAIL_DEFAULT_SEND_FROM: props.smtp.fromEmail,
            SMTP_SERVER: props.smtp.host,
            SMTP_PORT: props.smtp.port.toString(),
            SMTP_USERNAME: props.smtp.username,
            SMTP_PASSWORD: props.smtp.password,
            SMTP_USE_TLS: props.smtp.tls ? "true" : "false",

            INDEXING_MAX_SEGMENTATION_TOKENS_LENGTH: "4000",
            INVITE_EXPIRY_HOURS: "72",
            RESET_PASSWORD_TOKEN_EXPIRY_MINUTES: "5",

            CODE_EXECUTION_ENDPOINT: `http://${DifyStack.DIFY_SANDBOX_SERVICE_DNS_NAME}:${DifySandboxTaskDefinitionStack.DIFY_SANDBOX_PORT}`,
            CODE_MAX_NUMBER: "9223372036854775807",
            CODE_MIN_NUMBER: "-9223372036854775808",
            CODE_MAX_DEPTH: "5",
            CODE_MAX_PRECISION: "20",
            CODE_MAX_STRING_LENGTH: "80000",
            CODE_MAX_STRING_ARRAY_LENGTH: "30",
            CODE_MAX_OBJECT_ARRAY_LENGTH: "30",
            CODE_MAX_NUMBER_ARRAY_LENGTH: "1000",
            CODE_EXECUTION_CONNECT_TIMEOUT: "10",
            CODE_EXECUTION_READ_TIMEOUT: "60",
            CODE_EXECUTION_WRITE_TIMEOUT: "10",
            TEMPLATE_TRANSFORM_MAX_LENGTH: "80000",

            WORKFLOW_MAX_EXECUTION_STEPS: "500",
            WORKFLOW_MAX_EXECUTION_TIME: "1200",
            WORKFLOW_CALL_MAX_DEPTH: "5",
            MAX_VARIABLE_SIZE: "204800",

            WORKFLOW_PARALLEL_DEPTH_LIMIT: "3",
            WORKFLOW_FILE_UPLOAD_LIMIT: "10",
            HTTP_REQUEST_NODE_MAX_BINARY_SIZE: "10485760",
            HTTP_REQUEST_NODE_MAX_TEXT_SIZE: "1048576",
            HTTP_REQUEST_NODE_SSL_VERIFY: "True",

            SANDBOX_PORT: "8194",
            SANDBOX_GIN_MODE: "release",
            SANDBOX_WORKER_TIMEOUT: "15",
            SANDBOX_ENABLE_NETWORK: "true",

            TOP_K_MAX_VALUE: "10",
            EXPOSE_PLUGIN_DAEMON_PORT: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_PORT.toString(),
            PLUGIN_DAEMON_PORT: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_DEBUG_PORT.toString(),
            PLUGIN_DAEMON_URL: `http://${DifyStack.DIFY_PLUGIN_DAEMON_SERVICE_DNS_NAME}:${DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_PORT}`,
            PLUGIN_MAX_PACKAGE_SIZE: "52428800",
            PLUGIN_PPROF_ENABLED: "false",
            PLUGIN_DEBUGGING_HOST: "0.0.0.0",
            PLUGIN_DEBUGGING_PORT: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_DEBUG_PORT.toString(),
            EXPOSE_PLUGIN_DEBUGGING_HOST: DifyStack.DIFY_PLUGIN_DAEMON_SERVICE_DNS_NAME,
            EXPOSE_PLUGIN_DEBUGGING_PORT: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_DEBUG_PORT.toString(),

            PLUGIN_DIFY_INNER_API_URL: `http://${DifyStack.DIFY_API_SERVICE_DNS_NAME}:${DifyApiTaskDefinitionStack.DIFY_API_PORT}`,

            // ENDPOINT_URL_TEMPLATE: ${ENDPOINT_URL_TEMPLATE:-http://localhost/e/{hook_id}}
            MARKETPLACE_ENABLED: "true",
            MARKETPLACE_API_URL: "https://marketplace.dify.ai",
            MARKETPLACE_URL: "https://marketplace.dify.ai",

            FORCE_VERIFYING_SIGNATURE: "true",

            PLUGIN_PYTHON_ENV_INIT_TIMEOUT: "120",
            PLUGIN_MAX_EXECUTION_TIMEOUT: "600",
            // PIP_MIRROR_URL: ${PIP_MIRROR_URL:-}
        }
    }

    static getSharedSecretEnvironment(props: DifyTaskDefinitionStackProps): Record<string, Secret> {
        return {
            SECRET_KEY: Secret.fromSecretsManager(props.apiSecretKey),
            CODE_EXECUTION_API_KEY: Secret.fromSecretsManager(props.sandboxCodeExecutionKey),
            PLUGIN_DIFY_INNER_API_KEY: Secret.fromSecretsManager(props.pluginInnerApiKey),
            SANDBOX_API_KEY: Secret.fromSecretsManager(props.sandboxCodeExecutionKey),
            PLUGIN_DAEMON_KEY: Secret.fromSecretsManager(props.pluginDaemonKey),

            DB_USERNAME: Secret.fromSecretsManager(props.metadataStore.secret, "username"),
            DB_PASSWORD: Secret.fromSecretsManager(props.metadataStore.secret, "password"),
            DB_HOST: Secret.fromSecretsManager(props.metadataStore.secret, "host"),
            DB_PORT: Secret.fromSecretsManager(props.metadataStore.secret, "port"),

            PGVECTOR_HOST: Secret.fromSecretsManager(props.vectorStore.secret, "host"),
            PGVECTOR_PORT: Secret.fromSecretsManager(props.vectorStore.secret, "port"),
            PGVECTOR_USERNAME: Secret.fromSecretsManager(props.vectorStore.secret, "username"),
            PGVECTOR_PASSWORD: Secret.fromSecretsManager(props.vectorStore.secret, "password"),

        }
    }


    static getApiEnvironment(taskDefinitionProps: DifyTaskDefinitionStackProps, region: string): Record<string, string> {
        const env = this.getSharedEnvironment(taskDefinitionProps, region);
        return {
            ...env,
            MODE: "api",
            // SENTRY_DSN: "",
            // SENTRY_TRACES_SAMPLE_RATE: "1.0",
            // SENTRY_PROFILES_SAMPLE_RATE: "1.0",
            PLUGIN_REMOTE_INSTALL_HOST: DifyStack.DIFY_PLUGIN_DAEMON_SERVICE_DNS_NAME,
            PLUGIN_REMOTE_INSTALL_PORT: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_DEBUG_PORT.toString(),
            PLUGIN_MAX_PACKAGE_SIZE: "52428800",

        };
    }

    static getApiSecretEnvironment(taskDefinitionProps: DifyTaskDefinitionStackProps): Record<string, Secret> {
        const env = this.getSharedSecretEnvironment(taskDefinitionProps);
        return {
            ...env,
            INNER_API_KEY_FOR_PLUGIN: Secret.fromSecretsManager(taskDefinitionProps.pluginInnerApiKey)
        }
    }

    static getWorkerEnvironment(taskDefinitionProps: DifyTaskDefinitionStackProps, region: string): Record<string, string> {
        const env = this.getApiEnvironment(taskDefinitionProps, region);
        return {
            ...env,
            MODE: "worker",
            // SENTRY_DSN: "",
            // SENTRY_TRACES_SAMPLE_RATE: "1.0",
            // SENTRY_PROFILES_SAMPLE_RATE: "1.0",
            PLUGIN_MAX_PACKAGE_SIZE: "52428800",
        };
    }

    static getWorkerSecretEnvironment(taskDefinitionProps: DifyTaskDefinitionStackProps): Record<string, Secret> {
        const env = this.getApiSecretEnvironment(taskDefinitionProps);
        return {
            ...env,
            INNER_API_KEY_FOR_PLUGIN: Secret.fromSecretsManager(taskDefinitionProps.pluginInnerApiKey)
        }
    }

    static getWebEnvironment(): Record<string, string> {
        return {
            EDITION: "SELF_HOSTED",

            CONSOLE_API_URL: "",
            APP_API_URL: "",
            // SENTRY_DSN: ${ WEB_SENTRY_DSN: -}
            NEXT_TELEMETRY_DISABLED: "",
            TEXT_GENERATION_TIMEOUT_MS: "60000",
            CSP_WHITELIST: "",
            TOP_K_MAX_VALUE: "",
            INDEXING_MAX_SEGMENTATION_TOKENS_LENGTH: "",
            PM2_INSTANCES: "2",
            LOOP_NODE_MAX_COUNT: "100",
            MAX_TOOLS_NUM: "10",
            MAX_PARALLEL_LIMIT: "10",

            MARKETPLACE_API_URL: "https://marketplace.dify.ai",
            MARKETPLACE_URL: "https://marketplace.dify.ai"
        }
    }

    static getSandboxEnvironment(): Record<string, string> {
        return {
            GIN_MODE: "release",
            WORKER_TIMEOUT: "15",
            ENABLE_NETWORK: "true",
            SANDBOX_PORT: "8194"
        };
    }

    static getSandboxSecretEnvironment(props: DifyTaskDefinitionStackProps): Record<string, Secret> {
        return {
            API_KEY: Secret.fromSecretsManager(props.sandboxCodeExecutionKey)
        }
    }

    static getPluginDaemonEnvironment(props: DifyTaskDefinitionStackProps, region: string): Record<string, string> {
        const env = this.getSharedEnvironment(props, region)
        return {
            ...env,
            GIN_MODE: 'release',
            PLATFORM: 'local',
            DB_DATABASE: MetadataStoreStack.DEFAULT_PLUGIN_DATABASE,
            SERVER_PORT: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_PORT.toString(),
            MAX_PLUGIN_PACKAGE_SIZE: "52428800",
            MAX_BUNDLE_PACKAGE_SIZE: "52428800",

            PPROF_ENABLED: "false",
            DIFY_INNER_API_URL: `http://${DifyStack.DIFY_API_SERVICE_DNS_NAME}:${DifyApiTaskDefinitionStack.DIFY_API_PORT}`,
            PLUGIN_REMOTE_INSTALLING_ENABLED: 'true',
            PLUGIN_REMOTE_INSTALLING_HOST: DifyStack.DIFY_PLUGIN_DAEMON_SERVICE_DNS_NAME,
            PLUGIN_REMOTE_INSTALLING_PORT: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_DEBUG_PORT.toString(),
            PLUGIN_STORAGE_TYPE: 'aws_s3',
            PLUGIN_STORAGE_OSS_BUCKET: props.fileStore.bucket.bucketName,
            PLUGIN_INSTALLED_PATH: "plugin",
            PLUGIN_WORKING_PATH: "/app/storage/cwd",

            ROUTINE_POOL_SIZE: '10000',
            LIFETIME_COLLECTION_HEARTBEAT_INTERVAL: '5',
            LIFETIME_COLLECTION_GC_INTERVAL: '60',
            LIFETIME_STATE_GC_INTERVAL: '300',
            DIFY_INVOCATION_CONNECTION_IDLE_TIMEOUT: '120',

            FORCE_VERIFYING_SIGNATURE: "true",
            PYTHON_ENV_INIT_TIMEOUT: "120",
            PLUGIN_MAX_EXECUTION_TIMEOUT: "600",
            PIP_MIRROR_URL: ""
        };
    }

    static getPluginDaemonSecretEnvironment(props: DifyTaskDefinitionStackProps): Record<string, Secret> {
        const env = this.getSharedSecretEnvironment(props)
        return {
            ...env,
            SERVER_KEY: Secret.fromSecretsManager(props.pluginDaemonKey),
            DIFY_INNER_API_KEY: Secret.fromSecretsManager(props.pluginInnerApiKey)
        }
    }

}
