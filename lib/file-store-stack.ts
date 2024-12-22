import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { DifyFileStoreProps } from "./task-definitions/props";

export class FileStoreStack extends Stack {

    public readonly bucket: Bucket;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        this.bucket = new Bucket(this, 'ObjectStorage', {
            removalPolicy: RemovalPolicy.DESTROY
        });
    }

    public exportProps(): DifyFileStoreProps {
        return { bucket: this.bucket }
    }
}