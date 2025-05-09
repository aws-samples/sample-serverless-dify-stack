# sample-serverless-dify-stack

This project provides an AWS CDK implementation for deploying [Dify.AI](https://dify.ai/) , an open-source LLMOps platform, in a serverless architecture on AWS.

Dify.AI is a powerful tool for building AI-native applications. This serverless implementation leverages various AWS services to create a scalable, maintainable, and cost-effective deployment of Dify.AI.

![architecture](./resources/architecture.png)

### Key Features

1. **Simplified Container Deployment:** Leverages AWS Elastic Container Registry (ECR) as the container orchestration tool, significantly reducing the complexity and entry barrier of containerized deployment.

2. **Cost-Effective Scalability:** Implements AWS Serverless technology stack to ensure economic efficiency through elastic scaling, optimizing resource utilization based on actual demand.

### Requirements

1. Node.js (version 14.x or later) and TypeScript/JavaScript development environment

2. CDK bootstrapped in your target region, refer to [here](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) for detailed setup instructions.

### Deploy 

1. Prepare env values, copy `.env.example` to `.env` and update the env values;

2. Deploy the cdk stack using following command:
```
cdk deploy --region <region-code> --all --concurrency 5 --require-approval never
```
3. After deploy, you can find the dify endpoint in output: 
```
 ✅  ServerlessDifyStack

✨  Deployment time: 435.37s

Outputs:
ServerlessDifyStack.DifyEndpoint = Server-Ingre-xxxxxxx-xxxxxxx.us-east-1.elb.amazonaws.com
Stack ARN:
arn:aws:cloudformation:us-east-1:xxxxxxxx:stack/ServerlessDifyStack/16d8e980-ed22-11ef-b28b-xxxxxxxxxx
```
