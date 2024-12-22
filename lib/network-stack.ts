import { Stack, StackProps } from "aws-cdk-lib";
import { GatewayVpcEndpointAwsService, IpAddresses, Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { MetadataStoreStack } from "./metadata-store-stack";
import { DifyNetworkProps } from "./task-definitions/props";
import { VectorStoreStack } from "./vector-store-stack";

export class NetworkStack extends Stack {

    public readonly vpc: Vpc;

    public readonly ingressSg: SecurityGroup;

    public readonly difyServiceSg: SecurityGroup;

    public readonly metadataStoreSg: SecurityGroup;

    public readonly vectorStoreSg: SecurityGroup;

    public readonly redisSg: SecurityGroup;

    public readonly celeryBrokerSg: SecurityGroup;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        this.vpc = new Vpc(this, 'ServerlessDifyNetworkVpcStack', {
            enableDnsHostnames: true,
            enableDnsSupport: true,
            ipAddresses: IpAddresses.cidr("10.0.0.0/16"),

            natGateways: 1,
            natGatewaySubnets: { subnetType: SubnetType.PUBLIC },

            gatewayEndpoints: { S3: { service: GatewayVpcEndpointAwsService.S3 } }
        });

        this.ingressSg = new SecurityGroup(this, 'IngressSg', { vpc: this.vpc, allowAllOutbound: true })
        this.ingressSg.connections.allowFromAnyIpv4(Port.HTTP)
        this.ingressSg.connections.allowFromAnyIpv4(Port.HTTPS)
        this.ingressSg.connections.allowFromAnyIpv4(Port.allIcmp())

        this.difyServiceSg = new SecurityGroup(this, 'DifyServiceSg', { vpc: this.vpc, allowAllOutbound: true })
        this.difyServiceSg.connections.allowInternally(Port.allTraffic())
        this.difyServiceSg.connections.allowFrom(this.ingressSg, Port.allTcp())

        this.metadataStoreSg = new SecurityGroup(this, 'MetadataStoreSg', { vpc: this.vpc, allowAllOutbound: true });
        this.metadataStoreSg.connections.allowInternally(Port.allTraffic())
        this.metadataStoreSg.connections.allowFrom(this.difyServiceSg, Port.tcp(MetadataStoreStack.PORT))

        this.vectorStoreSg = new SecurityGroup(this, 'VectorStoreSg', { vpc: this.vpc, allowAllOutbound: true });
        this.vectorStoreSg.connections.allowInternally(Port.allTraffic())
        this.vectorStoreSg.connections.allowFrom(this.difyServiceSg, Port.tcp(VectorStoreStack.PORT))

        this.redisSg = new SecurityGroup(this, 'RedisSg', { vpc: this.vpc, allowAllOutbound: true });
        this.redisSg.connections.allowInternally(Port.allTraffic())
        this.redisSg.connections.allowFrom(this.difyServiceSg, Port.tcp(6379))

        this.celeryBrokerSg = new SecurityGroup(this, 'CeleryBrokerSg', { vpc: this.vpc, allowAllOutbound: true });
        this.celeryBrokerSg.connections.allowInternally(Port.allTraffic())
        this.celeryBrokerSg.connections.allowFrom(this.difyServiceSg, Port.tcp(6379))
    }

    public exportProps(): DifyNetworkProps {
        return { vpc: this.vpc, taskSecurityGroup: this.difyServiceSg }
    }
}



