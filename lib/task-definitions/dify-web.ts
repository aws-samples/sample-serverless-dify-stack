import { NestedStack } from "aws-cdk-lib";
import { AppProtocol, AwsLogDriverMode, Compatibility, ContainerImage, CpuArchitecture, LogDriver, NetworkMode, OperatingSystemFamily, Protocol, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { DifyTaskDefinitionStackProps } from "./props";
import { TaskEnvironments } from "./task-environments";

export class DifyWebTaskDefinitionStack extends NestedStack {

    public readonly definition: TaskDefinition

    static readonly DIFY_WEB_PORT: number = 3000

    static readonly HEALTHY_ENDPOINT = "/apps"

    constructor(scope: Construct, id: string, props: DifyTaskDefinitionStackProps) {
        super(scope, id, props)

        const taskRole = new Role(this, 'ServerlessDifyClusterWebTaskRole', {
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
        })
        taskRole.addToPrincipalPolicy(new PolicyStatement({
            actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
            resources: ['*']
        }))
        taskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryPullOnly'))
        props.fileStore.bucket.grantReadWrite(taskRole)

        this.definition = new TaskDefinition(this, 'DifyWebTaskDefinitionStack', {
            taskRole: taskRole,
            executionRole: taskRole,
            compatibility: Compatibility.EC2_AND_FARGATE,
            networkMode: NetworkMode.AWS_VPC,
            runtimePlatform: {
                operatingSystemFamily: OperatingSystemFamily.LINUX,
                cpuArchitecture: CpuArchitecture.X86_64
            },
            cpu: '512',
            memoryMiB: '1024',
        })

        this.definition.addContainer('web', {
            containerName: "main",
            essential: true,
            image: ContainerImage.fromRegistry(props.difyImage.web),
            cpu: 512,
            memoryLimitMiB: 1024,
            portMappings: [{
                name: "serverless-dify-web-3000-tcp",
                containerPort: DifyWebTaskDefinitionStack.DIFY_WEB_PORT,
                hostPort: DifyWebTaskDefinitionStack.DIFY_WEB_PORT,
                protocol: Protocol.TCP, appProtocol: AppProtocol.http
            }],
            logging: LogDriver.awsLogs({
                streamPrefix: 'web',
                mode: AwsLogDriverMode.NON_BLOCKING,
                logGroup: props.difyClusterLogGroup
            }),
            environment: TaskEnvironments.getWebEnvironment()
        })
    }

}