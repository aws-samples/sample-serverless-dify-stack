import { StackProps } from "aws-cdk-lib";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { ApplicationListener, ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Role } from "aws-cdk-lib/aws-iam";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export interface DifyNetworkProps { vpc: Vpc, taskSecurityGroup: SecurityGroup }

export interface DifyFileStoreProps { bucket: Bucket }

export interface DifyVectorStorePgProps { hostname: string, port: number, defaultDatabase: string, secret: Secret }

export interface DifyMetadataStoreProps { hostname: string, port: number, defaultDatabase: string, secret: Secret }

export interface DifyRedisProps { hostname: string, port: string }

export interface DifyCeleryBrokerProps { hostname: string, port: string }

export interface DifyIngressProps { lb: ApplicationLoadBalancer, listener: ApplicationListener }

export interface SmtpServerProps { host: string, port: string, username: string, password: string, tls: boolean, fromEmail: string }

export interface DifyImage { api: string, web: string, sandbox: string, pluginDaemon: string }

export interface DifyTaskDefinitionStackProps extends StackProps {

    network: DifyNetworkProps

    celeryBroker: DifyCeleryBrokerProps

    redis: DifyRedisProps

    metadataStore: DifyMetadataStoreProps

    vectorStore: DifyVectorStorePgProps

    fileStore: DifyFileStoreProps

    apiSecretKey: Secret

    pluginInnerApiKey: Secret

    pluginDaemonKey: Secret

    sandboxCodeExecutionKey: Secret

    smtp: SmtpServerProps

    difyImage: DifyImage

    difyTaskRole: Role

    difyClusterLogGroup: LogGroup
}