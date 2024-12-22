#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { CeleryBrokerStack } from '../lib/celery-broker-stack';
import { DifyStack } from '../lib/dify-stack';
import { FileStoreStack } from '../lib/file-store-stack';
import { IngressStack } from '../lib/ingress-stack';
import { MetadataStoreStack } from '../lib/metadata-store-stack';
import { NetworkStack } from '../lib/network-stack';
import { RedisStack } from '../lib/redis-stack';
import { VectorStoreStack } from '../lib/vector-store-stack';

const app = new cdk.App();

// new ServerlessDifyStack(app, 'ServerlessDifyStack', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */

// });


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
        host: "email-smtp.us-east-1.amazonaws.com",
        port: 587,
        username: "xxxxxxxxxxxxxxxxxxxxx",
        password: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        tls: true,
        fromEmail: ""
    }
})

dify.addDependency(network)
dify.addDependency(fileStore)
dify.addDependency(ingress)
dify.addDependency(metadataStore)
dify.addDependency(vectorStore)
dify.addDependency(redis)
dify.addDependency(celeryBroker)