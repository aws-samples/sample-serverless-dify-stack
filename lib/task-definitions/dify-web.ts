import { NestedStack, RemovalPolicy } from "aws-cdk-lib";
import { AppProtocol, AwsLogDriverMode, Compatibility, ContainerImage, CpuArchitecture, LogDriver, NetworkMode, OperatingSystemFamily, Protocol, TaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { DifyTaskDefinitionStackProps } from "./props";

export class DifyWebTaskDefinitionStack extends NestedStack {

    public readonly definition: TaskDefinition

    static readonly DIFY_WEB_PORT: number = 3000

    static readonly HEALTHY_ENDPOINT = "/apps"

    constructor(scope: Construct, id: string, props: DifyTaskDefinitionStackProps) {
        super(scope, id, props)

        const taskRole = new Role(this, 'ServerlessDifyClusterWebTaskRole', {
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [{ managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' }]
        })

        this.definition = new TaskDefinition(this, 'DifyWebTaskDefinitionStack', {
            family: "serverless-dify-web",
            taskRole: taskRole,
            executionRole: taskRole,
            compatibility: Compatibility.EC2_AND_FARGATE,
            networkMode: NetworkMode.AWS_VPC,
            runtimePlatform: {
                operatingSystemFamily: OperatingSystemFamily.LINUX,
                cpuArchitecture: CpuArchitecture.ARM64
            },
            cpu: '512',
            memoryMiB: '1024',
        })

        this.definition.addContainer('web', {
            containerName: "main",
            essential: true,
            image: ContainerImage.fromRegistry("langgenius/dify-web"),
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
                logGroup: new LogGroup(this, "DifyWebLogGroup", {
                    retention: RetentionDays.ONE_WEEK,
                    removalPolicy: RemovalPolicy.DESTROY,
                    logGroupName: '/ecs/serverless-dify/web'
                })
            }),
            environment: {
                "CONSOLE_WEB_URL": "",
                "SERVICE_API_URL": "",
                "APP_API_URL": "",
                "APP_WEB_URL": "",
                "CONSOLE_API_URL": "",
                "EDITION": "SELF_HOSTED"
            }
        })
    }

}