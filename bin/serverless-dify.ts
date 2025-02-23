#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import 'source-map-support/register';
import { CeleryBrokerStack } from '../lib/celery-broker-stack';
import { DifyStack } from '../lib/dify-stack';
import { FileStoreStack } from '../lib/file-store-stack';
import { IngressStack } from '../lib/ingress-stack';
import { MetadataStoreStack } from '../lib/metadata-store-stack';
import { NetworkStack } from '../lib/network-stack';
import { RedisStack } from '../lib/redis-stack';
import { VectorStoreStack } from '../lib/vector-store-stack';

dotenv.config()

// initialize cdk context
const app = new cdk.App();

// create network environment 
const network = new NetworkStack(app, "ServerlessDifyNetworkStack", {})

const fileStore = new FileStoreStack(app, "ServerlessDifyFileStoreStack", {})

const ingress = new IngressStack(app, "ServerlessDifyIngressStack", { vpc: network.vpc, sg: network.ingressSg })
ingress.addDependency(network)

const metadataStore = new MetadataStoreStack(app, "ServerlessDifyMetadataStoreStack", { vpc: network.vpc, sg: network.metadataStoreSg })
metadataStore.addDependency(network)

const vectorStore = new VectorStoreStack(app, "ServerlessDifyVectorStoreStack", { vpc: network.vpc, sg: network.vectorStoreSg })
vectorStore.addDependency(network)

const redis = new RedisStack(app, "ServerlessDifyRedisStack", { vpc: network.vpc, sg: network.redisSg })
redis.addDependency(network)

const celeryBroker = new CeleryBrokerStack(app, "ServerlessDifyCeleryBrokerStack", { vpc: network.vpc, sg: network.celeryBrokerSg })
celeryBroker.addDependency(network)

const dify = new DifyStack(app, "ServerlessDifyStack", {
    network: network.exportProps(),
    fileStore: fileStore.exportProps(),
    ingress: ingress.exportProps(),
    metadataStore: metadataStore.exportProps(),
    vectorStore: vectorStore.exportProps(),
    redis: redis.exportProps(),
    celeryBroker: celeryBroker.exportProps(),
    smtp: {
        host: process.env.SMTP_SERVER_HOST || 'email-smtp.us-east-1.amazonaws.com',
        port: process.env.SMTP_SERVER_PORT || '578',
        username: process.env.SMTP_SERVER_USERNAME || 'admin',
        password: process.env.SMTP_SERVER_PASSWORD || 'admin',
        tls: process.env.SMTP_SERVER_TLS_ENABLED == 'true' ? true : false,
        fromEmail: process.env.SMTP_SERVER_SEND_FROM || 'admin@example.com'
    },
    difyImage: {
        api: process.env.DIFY_API_IMAGE || 'langgenius/dify-api:latest',
        web: process.env.DIFY_WEB_IMAGE || 'langgenius/dify-web:latest',
        sandbox: process.env.DIFY_SANDBOX_IMAGE || 'langgenius/dify-sandbox:latest'
    }
})

dify.addDependency(network)
dify.addDependency(fileStore)
dify.addDependency(ingress)
dify.addDependency(metadataStore)
dify.addDependency(vectorStore)
dify.addDependency(redis)
dify.addDependency(celeryBroker)