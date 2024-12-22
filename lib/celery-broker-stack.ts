import { Stack, StackProps } from "aws-cdk-lib";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { CfnServerlessCache } from "aws-cdk-lib/aws-elasticache";
import { Construct } from "constructs";
import { DifyCeleryBrokerProps } from "./task-definitions/props";

export interface CeleryBrokerStackProps extends StackProps {

    vpc: Vpc

    sg: SecurityGroup
}

export class CeleryBrokerStack extends Stack {

    public readonly cluster: CfnServerlessCache

    constructor(scope: Construct, id: string, props: CeleryBrokerStackProps) {
        super(scope, id, props)

        this.cluster = new CfnServerlessCache(this, 'CeleryBroker', {
            engine: 'redis',
            serverlessCacheName: 'serverless-dify-celery-broker',
            description: 'serverless redis cluster using for celery broker',
            securityGroupIds: [props.sg.securityGroupId],
            subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId)
        })

    }

    public exportProps(): DifyCeleryBrokerProps {
        return { hostname: this.cluster.attrEndpointAddress, port: this.cluster.attrEndpointPort }
    }

}