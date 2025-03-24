import { Duration, NestedStack } from "aws-cdk-lib";
import { AppProtocol, AwsLogDriverMode, Compatibility, ContainerImage, CpuArchitecture, LogDriver, NetworkMode, OperatingSystemFamily, Protocol, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { DifyTaskDefinitionStackProps } from "./props";
import { TaskEnvironments } from "./task-environments";

export class DifyApiTaskDefinitionStack extends NestedStack {

    static readonly DIFY_API_PORT = 5001

    static readonly HEALTHY_ENDPOINT = "/health"

    static readonly API_PORT_MAPPING_NAME = "serverless-dify-api-5001-tcp"

    public readonly definition: TaskDefinition

    constructor(scope: Construct, id: string, props: DifyTaskDefinitionStackProps) {
        super(scope, id, props);

        this.definition = new TaskDefinition(this, 'DifyApiTaskDefinitionStack', {
            taskRole: props.difyTaskRole,
            executionRole: props.difyTaskRole,
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
                logGroup: props.difyClusterLogGroup,
            }),
            healthCheck: {
                command: ['CMD-SHELL', 'curl -f http://localhost:5001/health || exit 1'],
                interval: Duration.seconds(15),
                startPeriod: Duration.seconds(90),
                retries: 10,
                timeout: Duration.seconds(5)
            },

            environment: TaskEnvironments.getApiEnvironment(props, this.region),
            secrets: TaskEnvironments.getApiSecretEnvironment(props),
        })
    }
}