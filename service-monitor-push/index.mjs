import connectWithSecret from '../src/aws-connect-with-secret.js';
import decodeMode from '../src/decode-mode.js';
import decodePower from '../src/decode-power.js';
import decodeError from '../src/decode-error.js';
import decodeEnvPm from '../src/decode-env-pm.js';
import { convertError } from '../src/decode-helpers.js';
import { readFile } from 'node:fs/promises';


import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import amqplib from 'amqplib';

const MAX_MESSAGE_COUNT = 100;
const MAX_MESSAGE_DELAY = 20000; 

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
    let amqpOptions = {};
    let protocol = "amqp";

    if (process.env.AMQP_TLS_KEY_FILE) {
        amqpOptions.key = await readFile(process.env.AMQP_TLS_KEY_FILE); 
        amqpOptions.cert = await readFile(process.env.AMQP_TLS_CERT_FILE); 
        protocol = "amqps";
    }

    if (process.env.AMQP_TLS_CA_FILE) {
        amqpOptions.ca = [await readFile(process.env.AMQP_TLS_CA_FILE)]; 
        protocol = "amqps";
    }

    const qConnection = await amqplib.connect(
        {
            protocol : protocol,
            hostname: process.env.AMQP_HOST,
            username : "oauth2",
            password : process.env.AMQP_JWT_TOKEN
        },
        amqpOptions
    );
    
    qConnection.on('error', function (err) {
        console.warn(err, err.stack);
        process.exit(1);
    });

    const qChannel = await qConnection.createChannel();
    qChannel.on('error', function (err) {
        console.warn(err, err.stack);
        process.exit(1);
    });

    [
        process.env.AMQP_POWER_QUEUE,
        process.env.AMQP_MODE_QUEUE,
        process.env.AMQP_ERROR_QUEUE,
        process.env.AMQP_ENV_PM_QUEUE
    ].forEach(function (queueName) {
        if (queueName) {
            qChannel.assertQueue(
                queueName,
                {
                    "durable" : true,
                    "arguments" : {
                    }
                }
            )
        }
    })

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

        try {

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
                        errorMessages.push(errorText);
                    } else {
                        errorMessage.ts = Date.now();
                        errorMessages.push(errorMessage);
                    }

                case "pm":
                    let pmMessage = decodeEnvPm(message);
                    pmMessage.ts = Date.now();
                    pmMessages.push(pmMessage);

                default:
                    break;
            }
        } catch (e) {
            console.warn(e, e.stack);
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
            await sendMessages(qChannel, process.env.AMQP_POWER_QUEUE, powerMessages);
        }

        if (modeMessages.length) {
            await sendMessages(qChannel, process.env.AMQP_MODE_QUEUE, modeMessages);
        }

        if (errorMessages.length) {
            await sendMessages(qChannel, process.env.AMQP_ERROR_QUEUE, errorMessages);
        }

        if (pmMessages.length) {
            await sendMessages(qChannel, process.env.AMQP_ENV_PM_QUEUE, pmMessages);
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

async function sendMessages(qChannel, queueName, messageArray) {
    let sendCount = 0;
    let rv = true;
    
    try {
        
        let toSend = messageArray.splice(0,Math.min(messageArray.length, 200));
        rv = qChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(toSend)));
        sendCount+= toSend.length;

        /*
        while (rv && messageArray.length) {
            let next = messageArray.shift();
            rv = qChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(next)));
            sendCount++;
        }
        */

    } catch (e) {
        console.log(e, e.stack);
        return 0;
    }

    return sendCount;
}
