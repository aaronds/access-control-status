import connectWithSecret from '../src/aws-connect-with-secret.js';
import decodeMode from '../src/decode-mode.js';
import decodePower from '../src/decode-power.js';
import decodeError from '../src/decode-error.js';
import decodeEnvPm from '../src/decode-env-pm.js';

import { convertError } from '../src/decode-helpers.js';

import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const MAX_MESSAGE_COUNT = 100;
const MAX_MESSAGE_DELAY = 20000; 

const sqsClient = new SQSClient({});

(async function () {
    let modeMessages = [];
    let powerMessages = [];
    let errorMessages = [];
    let pmMessages = [];

    let stsClient = new STSClient({ });
    let clientId = "service-monitor-push-" + Date.now() + "-" + Math.round(Math.random() * 100000)
    let mqttClient = null;
    let webClientRole = null;
    let accessKeyId, secretAccessKey, sessionToken;

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
        let topic = message.topic;
        let messageType = topic.split("/")[2];

        switch(messageType) {
            case "power":
                let powerMessage = decodePower(message);
                powerMessage.ts = Date.now();
                powerMessages.push(powerMessage);
                break;

            case "mode":
                let modeMessage = decodeMode(message);
                modeMessage.ts = Date.now();
                modeMessages.push(modeMessage);
                break;
            case "error":
                let errorMessage = decodeError(message);
                let errorText = convertError(errorMessage);

                if (errorText) {
                    errorText.ts = Date.now();
                    errorMessages.push(errorMessage);
                } else {
                    errorMessage.ts = Date.now();
                    errorMessages.push(errorMessage);
                }

            case "pm":
                let pmMessage = decodeEnvPm(message);
                pmMessage.ts = Date.now();
                console.log(pmMessage);
                pmMessages.push(pmMessage);

            default:
                break;
        }

    }
        
    mqttClient.onConnectionLost = function (e) {
        console.warn(e, e.stack);
        process.exit(1);
    }

    await mqttClient.subscribe("acs/message/mode/#");
    await mqttClient.subscribe("acs/message/power/#");
    await mqttClient.subscribe("acs/message/error/#");
    await mqttClient.subscribe("env/message/pm/#");

    let submitDelay = MAX_MESSAGE_DELAY;
    
    while (true) {
        await delay(submitDelay);

        if (powerMessages.length) {
            await sendMessages(process.env.SQS_POWER_URL, powerMessages);
        }

        if (modeMessages.length) {
            await sendMessages(process.env.SQS_MODE_URL, modeMessages);
        }

        if (errorMessages.length) {
            await sendMessages(process.env.SQS_ERROR_URL, errorMessages);
        }

        if (pmMessages.length) {
            await sendMessages(process.env.SQS_ENV_PM_URL, pmMessages);
        }

        let remainingMessages = errorMessages.length + powerMessages.length + modeMessages.length + pmMessages.length;

        if (remainingMessages > (MAX_MESSAGE_COUNT / 2) && submitDelay > 1000) {
            submitDelay -= 1000; 
        } else if (submitDelay < MAX_MESSAGE_DELAY && remainingMessages < (MAX_MESSAGE_COUNT / 10)) {
            submitDelay += 1000;
        }

        console.log("Remaining Messages: ", remainingMessages, "Delay: ", submitDelay);
    }

})().then(function () {
    process.exit(0);
}).catch(function (e) {
    console.log(e, e.stack);
    process.exit(1);
})

function delay(time) {
    return new Promise((accept) => setTimeout(accept, time));
}

async function sendMessages(queueUrl, messageArray) {
    let sendCount = Math.min(messageArray.length, MAX_MESSAGE_COUNT);
    let messageArrayToSend = messageArray.splice(0, sendCount);

    try {
        await sqsClient.send(new SendMessageCommand({
            QueueUrl : queueUrl,
            MessageGroupId : "bhs",
            MessageBody : JSON.stringify(messageArrayToSend)
        }));

    } catch (e) {
        messageArray.splice.apply(messageArray, [messageArrayToSend.length,0].concat(messageArrayToSend)); 
        console.log(e, e.stack);
        return 0;
    }

    return sendCount;
}
