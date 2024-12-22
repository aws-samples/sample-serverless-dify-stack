import { Stack, StackProps } from "aws-cdk-lib";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { CfnServerlessCache } from "aws-cdk-lib/aws-elasticache";
import { Construct } from "constructs";
import { DifyRedisProps } from "./task-definitions/props";

export interface RedisStackProps extends StackProps {

    vpc: Vpc,

    sg: SecurityGroup

}

export class RedisStack extends Stack {

    public readonly cluster: CfnServerlessCache

    constructor(scope: Construct, id: string, props: RedisStackProps) {
        super(scope, id, props)

        this.cluster = new CfnServerlessCache(this, 'RedisCluster', {
            engine: 'redis',
            serverlessCacheName: 'serverless-dify-redis',
            description: 'serverless redis cluster using for dify redis',
            securityGroupIds: [props.sg.securityGroupId],
            subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId)
        })
    }

    public exportProps(): DifyRedisProps {
        return {
            hostname: this.cluster.attrEndpointAddress,
            port: this.cluster.attrEndpointPort
        }
    }

}