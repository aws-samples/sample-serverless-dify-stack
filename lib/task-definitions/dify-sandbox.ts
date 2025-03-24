import { NestedStack } from "aws-cdk-lib";
import { AppProtocol, AwsLogDriverMode, Compatibility, ContainerImage, CpuArchitecture, LogDriver, OperatingSystemFamily, Protocol, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { DifyTaskDefinitionStackProps } from "./props";
import { TaskEnvironments } from "./task-environments";

export class DifySandboxTaskDefinitionStack extends NestedStack {

    static readonly DIFY_SANDBOX_PORT = 8194

    static readonly SANDBOX_PORT_MAPPING_NAME = "serverless-dify-sandbox-8194-tcp"

    public readonly definition: TaskDefinition

    constructor(scope: Construct, id: string, props: DifyTaskDefinitionStackProps) {
        super(scope, id, props);
        this.definition = new TaskDefinition(this, "DifySandboxTaskDefinitionStack", {
            taskRole: props.difyTaskRole,
            executionRole: props.difyTaskRole,
            compatibility: Compatibility.EC2_AND_FARGATE,
            runtimePlatform: { operatingSystemFamily: OperatingSystemFamily.LINUX, cpuArchitecture: CpuArchitecture.X86_64 },
            cpu: '256',
            memoryMiB: '512',
        })

        this.definition.addContainer("sandbox", {
            containerName: "sandbox",
            image: ContainerImage.fromRegistry(props.difyImage.sandbox),
            portMappings: [
                {
                    containerPort: DifySandboxTaskDefinitionStack.DIFY_SANDBOX_PORT,
                    hostPort: DifySandboxTaskDefinitionStack.DIFY_SANDBOX_PORT,
                    name: DifySandboxTaskDefinitionStack.SANDBOX_PORT_MAPPING_NAME,
                    appProtocol: AppProtocol.http,
                    protocol: Protocol.TCP
                }
            ],
            logging: LogDriver.awsLogs({
                streamPrefix: "sandbox",
                mode: AwsLogDriverMode.NON_BLOCKING,
                logGroup: props.difyClusterLogGroup
            }),
            environment: TaskEnvironments.getSandboxEnvironment(),
            secrets: TaskEnvironments.getSandboxSecretEnvironment(props)
        })
    }
}
