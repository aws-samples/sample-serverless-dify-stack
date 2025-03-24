import { NestedStack } from "aws-cdk-lib";
import { AwsLogDriverMode, Compatibility, ContainerImage, CpuArchitecture, LogDriver, NetworkMode, OperatingSystemFamily, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { DifyTaskDefinitionStackProps } from "./props";
import { TaskEnvironments } from "./task-environments";

export class DifyWorkerTaskDefinitionStack extends NestedStack {

    public readonly definition: TaskDefinition;

    constructor(scope: Construct, id: string, props: DifyTaskDefinitionStackProps) {
        super(scope, id, props);

        this.definition = new TaskDefinition(this, 'DifyWorkerTaskDefinitionStack', {
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

        this.definition.addContainer('worker', {
            containerName: "worker",
            essential: true,
            image: ContainerImage.fromRegistry(props.difyImage.api),
            command: ['worker'],
            cpu: 512,
            memoryLimitMiB: 1024,
            environment: TaskEnvironments.getWorkerEnvironment(props, this.region),
            secrets: TaskEnvironments.getWorkerSecretEnvironment(props),
            logging: LogDriver.awsLogs({
                streamPrefix: 'worker',
                mode: AwsLogDriverMode.NON_BLOCKING,
                logGroup: props.difyClusterLogGroup,
            }),

        })
    }

}