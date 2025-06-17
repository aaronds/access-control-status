import connectWithSecret from '../src/aws-connect-with-secret.js';
import decodeMode from '../src/decode-mode.js';

import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

(async function () {
    let stsClient = new STSClient({ });
    let clientId = "service-status-" + Date.now() + "-" + Math.round(Math.random() * 100000)
    let mqttClient = null;
    let webClientRole = null;
    let devices = [];

    let accessKeyId = null;
    let secretAccessKey = null;
    let sessionToken = null;

    try {
        webClientRole = await stsClient.send(new AssumeRoleCommand({ RoleArn : process.env.webClientRole, RoleSessionName : clientId }));
    } catch (e) {
        console.log(e, e.stack)
    }

    if (webClientRole) {
        accessKeyId = webClientRole.Credentials.AccessKeyId;
        secretAccessKey = webClientRole.Credentials.SecretAccessKey;
        sessionToken = webClientRole.Credentials.SessionToken;
    } else {
        accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
        secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];
        sessionToken = process.env['AWS_SESSION_TOKEN'];
    }

    if (!accessKeyId) {
        throw new Error("No Access Key Resolved");
    }

    mqttClient = await connectWithSecret(accessKeyId, secretAccessKey, sessionToken, clientId);

    mqttClient.onMessageArrived = function (message) {
        let modeMessage = null;
        try {
           let modeMessage = decodeMode(message);

            let found = devices.findIndex((el) => el.id == modeMessage.id);

            if (found >= 0) {
                devices.splice(found, 1, modeMessage);
            } else {
                devices.push(modeMessage);
            }

        } catch (e) {
            console.log(e, e.stack);
        }

    };

    await mqttClient.subscribe("acs/message/mode/#");

    await new Promise((accept) => setTimeout(accept, 31000));

    let s3Client = new S3Client({});

    let currentStatusRes = await s3Client.send(new GetObjectCommand({ Bucket : process.env.statusBucket, Key : process.env.statusKey }));

    let currentStatus = JSON.parse(await currentStatusRes.Body.transformToString());

    for (let statusDevice of currentStatus) {
        let currentMode = devices.find((el) => el.id == statusDevice.id);
        statusDevice.mode = currentMode;
    }

    console.log(currentStatus);

    await s3Client.send(new PutObjectCommand({ Bucket : process.env.statusBucket, Key : process.env.statusKey, Body : JSON.stringify(currentStatus)}));

})().then(function () {
    process.exit(0);
}).catch(function (e) {
    console.log(e, e.stack);
    process.exit(1);
})
