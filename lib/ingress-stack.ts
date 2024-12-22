import { Stack, StackProps } from "aws-cdk-lib";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { ApplicationListener, ApplicationLoadBalancer, ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import { DifyIngressProps } from "./task-definitions/props";

export interface IngressStackProps extends StackProps {

    vpc: Vpc

    sg: SecurityGroup

}

export class IngressStack extends Stack {

    public readonly alb: ApplicationLoadBalancer

    public readonly listener: ApplicationListener

    constructor(scope: Construct, id: string, props: IngressStackProps) {
        super(scope, id, props)

        this.alb = new ApplicationLoadBalancer(this, "IngressStack", {
            vpc: props.vpc,
            securityGroup: props.sg,
            internetFacing: true,
            vpcSubnets: { subnetType: SubnetType.PUBLIC }
        })

        this.listener = this.alb.addListener("IngressListener80", {
            port: 80,
            protocol: ApplicationProtocol.HTTP,
        })
    }

    public exportProps(): DifyIngressProps {

        return {
            lb: this.alb,
            listener: this.listener,
        }

    }

}