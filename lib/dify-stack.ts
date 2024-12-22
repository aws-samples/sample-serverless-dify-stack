import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { SecurityGroup, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Cluster, FargateService } from "aws-cdk-lib/aws-ecs";
import { ApplicationListener, ApplicationProtocol, ListenerCondition } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { DifyApiTaskDefinitionStack } from "./task-definitions/dify-api";
import { DifyWebTaskDefinitionStack } from "./task-definitions/dify-web";
import { DifyWorkerTaskDefinitionStack } from "./task-definitions/dify-worker";
import { DifyCeleryBrokerProps, DifyFileStoreProps, DifyIngressProps, DifyMetadataStoreProps, DifyNetworkProps, DifyRedisProps, DifyTaskDefinitionStackProps, DifyVectorStorePgProps, SmtpServerProps } from "./task-definitions/props";

export interface DifyStackProps extends StackProps {

    readonly fileStore: DifyFileStoreProps

    readonly network: DifyNetworkProps

    readonly ingress: DifyIngressProps

    readonly celeryBroker: DifyCeleryBrokerProps

    readonly redis: DifyRedisProps

    readonly metadataStore: DifyMetadataStoreProps

    readonly vectorStore: DifyVectorStorePgProps

    readonly smtp: SmtpServerProps
}

export class DifyStack extends Stack {

    private readonly cluster: Cluster

    private readonly taskSecurityGroup: SecurityGroup

    private readonly listener: ApplicationListener

    constructor(scope: Construct, id: string, props: DifyStackProps) {
        super(scope, id, props)

        this.cluster = new Cluster(this, "ServerlessDifyEcsCluster", { vpc: props.network.vpc, enableFargateCapacityProviders: true })
        this.taskSecurityGroup = props.network.taskSecurityGroup

        this.listener = props.ingress.listener

        const difyTaskDefinitionStackProps: DifyTaskDefinitionStackProps = {
            network: props.network, fileStore: props.fileStore,
            celeryBroker: props.celeryBroker, redis: props.redis,
            metadataStore: props.metadataStore, vectorStore: props.vectorStore,
            apiSecretKey: new Secret(this, 'ServerlessDifyApiSecretKey', { generateSecretString: { passwordLength: 32 } }),
            sandboxCodeExecutionKey: new Secret(this, 'ServerlessDifySandboxCodeExecutionKey', { generateSecretString: { passwordLength: 32 } }),
            stmp: props.smtp
        }

        this.runApiService(difyTaskDefinitionStackProps)
        this.runWorkService(difyTaskDefinitionStackProps)
        this.runWebService(difyTaskDefinitionStackProps)
    }


    runApiService(props: DifyTaskDefinitionStackProps) {
        const taskDefinition = new DifyApiTaskDefinitionStack(this, 'DifyApiTaskDefinitionStack', props)
        const service = new FargateService(this, 'ServerlessDifyApiService', {
            cluster: this.cluster,
            taskDefinition: taskDefinition.definition,
            desiredCount: 1,
            serviceName: 'serverless-dify-api',
            vpcSubnets: this.cluster.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
            securityGroups: [this.taskSecurityGroup],
        })

        this.listener.addTargets('DifyApiTargets', {
            priority: 50000,
            targets: [service.loadBalancerTarget({ containerName: "main" })],
            conditions: [ListenerCondition.pathPatterns(["/console/api/*", "/api/*", "/v1/", "/files/"])],
            targetGroupName: "serverless-dify-api-tg",
            port: DifyApiTaskDefinitionStack.DIFY_API_PORT,
            protocol: ApplicationProtocol.HTTP,
            healthCheck: {
                path: DifyApiTaskDefinitionStack.HEALTHY_ENDPOINT,
                healthyHttpCodes: '200',
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5)
            }
        })

        return service
    }

    runWorkService(props: DifyTaskDefinitionStackProps) {
        const taskDefinition = new DifyWorkerTaskDefinitionStack(this, 'DifyWorkerTaskDefinitionStack', props)
        const service = new FargateService(this, 'ServerlessDifyWorkerService', {
            cluster: this.cluster,
            taskDefinition: taskDefinition.definition,
            desiredCount: 1,
            serviceName: 'serverless-dify-worker',
            vpcSubnets: this.cluster.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
            securityGroups: [this.taskSecurityGroup],
        })

        return service
    }

    runWebService(props: DifyTaskDefinitionStackProps) {
        const taskDefinition = new DifyWebTaskDefinitionStack(this, 'DifyWebServiceTaskDefinitionStack', props)
        const service = new FargateService(this, 'ServerlessDifyWebService', {
            cluster: this.cluster,
            taskDefinition: taskDefinition.definition,
            desiredCount: 1,
            serviceName: 'serverless-dify-web',
            vpcSubnets: this.cluster.vpc.selectSubnets({ subnetType: SubnetType.PRIVATE_WITH_EGRESS }),
            securityGroups: [this.taskSecurityGroup],
        })

        this.listener.addTargets('DifyWebTargets', {
            targets: [service.loadBalancerTarget({ containerName: "main" })],
            targetGroupName: "serverless-dify-web-tg",
            port: DifyWebTaskDefinitionStack.DIFY_WEB_PORT,
            protocol: ApplicationProtocol.HTTP,
            healthCheck: {
                path: DifyWebTaskDefinitionStack.HEALTHY_ENDPOINT,
                healthyHttpCodes: '200',
                interval: Duration.seconds(30),
                timeout: Duration.seconds(5)
            }
        })

        return service
    }
}