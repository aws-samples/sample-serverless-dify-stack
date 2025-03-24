import { NestedStack } from "aws-cdk-lib";
import { AppProtocol, AwsLogDriverMode, Compatibility, ContainerImage, CpuArchitecture, LogDriver, NetworkMode, OperatingSystemFamily, Protocol, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { DifyTaskDefinitionStackProps } from "./props";
import { TaskEnvironments } from "./task-environments";

export class DifyPluginDaemonTaskDefinitionStack extends NestedStack {

    static readonly DIFY_PLUGIN_DAEMON_PORT = 5002
    static readonly DIFY_PLUGIN_DAEMON_PORT_NAME = 'serverless-dify-plugin-daemon-5002-tcp'

    static readonly DIFY_PLUGIN_DAEMON_DEBUG_PORT = 5003
    static readonly DIFY_PLUGIN_DAEMON_DEBUG_PORT_NAME = 'serverless-dify-plugin-daemon-5003-tcp'


    public readonly definition: TaskDefinition

    constructor(scope: Construct, id: string, props: DifyTaskDefinitionStackProps) {
        super(scope, id, props);

        this.definition = new TaskDefinition(this, 'ServerlessDifyPluginDaemonTaskDefinition', {
            taskRole: props.difyTaskRole,
            executionRole: props.difyTaskRole,
            compatibility: Compatibility.EC2_AND_FARGATE,
            networkMode: NetworkMode.AWS_VPC,
            runtimePlatform: {
                operatingSystemFamily: OperatingSystemFamily.LINUX,
                cpuArchitecture: CpuArchitecture.X86_64
            },
            cpu: '256',
            memoryMiB: '512',
        })

        this.definition.addContainer('plugin-daemon', {
            containerName: 'main',
            essential: true,
            image: ContainerImage.fromRegistry(props.difyImage.pluginDaemon),
            portMappings: [
                {
                    containerPort: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_PORT,
                    hostPort: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_PORT,
                    name: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_PORT_NAME,
                    appProtocol: AppProtocol.http, protocol: Protocol.TCP
                },
                {
                    containerPort: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_DEBUG_PORT,
                    hostPort: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_DEBUG_PORT,
                    name: DifyPluginDaemonTaskDefinitionStack.DIFY_PLUGIN_DAEMON_DEBUG_PORT_NAME,
                    appProtocol: AppProtocol.http, protocol: Protocol.TCP
                }
            ],
            logging: LogDriver.awsLogs({
                streamPrefix: 'serverless-dify-plugin-daemon',
                mode: AwsLogDriverMode.NON_BLOCKING,
                logGroup: props.difyClusterLogGroup
            }),
            environment: TaskEnvironments.getPluginDaemonEnvironment(props, this.region),
            secrets: TaskEnvironments.getPluginDaemonSecretEnvironment(props)
        })
    }

}