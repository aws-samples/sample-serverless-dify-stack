import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import pkg from 'pg';
const { Client } = pkg;

export const handler = async (event) => {
    console.log(event)

    const secretArn = process.env.SECRET_ARN;

    const secretsManager = new SecretsManagerClient({});
    const secret = await secretsManager.send(
        new GetSecretValueCommand({ SecretId: secretArn })
    );

    const secretString = JSON.parse(secret.SecretString || '{}');
    const c = new Client({
        host: secretString.host,
        port: secretString.port.toString(),
        database: secretString.dbname,
        user: secretString.username,
        password: secretString.password
    })

    try {
        await c.connect()
        const response = await c.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log(response);
        return { Status: 'SUCCESS', Data: 'Extension created successfully' }
    } catch (error) {
        throw error
    } finally {
        await c.end()
    }
}