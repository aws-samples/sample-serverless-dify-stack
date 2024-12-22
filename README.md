# serverless-dify

Deploy a dify cluster using Amazon serverless stack.


### Deploy 

```
npm install aws-cdk-lib@2.150.0
cdk deploy --region <region-code> --all --concurrency 5 --require-approval never
```