import { ReceiveMessageCommand, DeleteMessageCommand, SQSClient, DeleteMessageBatchCommand } from "@aws-sdk/client-sqs";
import { pushTimeseries } from "prometheus-remote-write";

const sqsClient = new SQSClient({});

(async function pullEnvPm() {

    while (true) {        
        let deviceMetrics = {
        };
        let deviceLocation = {
        };

        let result = await sqsClient.send(new ReceiveMessageCommand({
            MaxNumberOfMessages: 10,
            QueueUrl: process.env.SQS_POWER_URL,
            WaitTimeSeconds: 20,
            VisibilityTimeout: 20
        }));

        let messages = result.Messages;

        if (!messages) {
            continue;
        }

        for (let message of messages) {
            let envPmMessages = JSON.parse(message.Body);

            for (let envPmMessage of envPmMessages) {

                let deviceId = envPmMessage.id;

                if (!deviceMetrics[deviceId]) {
                    deviceMetrics[deviceId] = envPmMetrics();
                }

                deviceMetrics[deviceId]['env_pm1'].push({value : envPmMessage.pm1, timestamp : envPmMessage.ts });
                deviceMetrics[deviceId]['env_pm2_5'].push({value : envPmMessage.pm2_5, timestamp : envPmMessage.ts });
                deviceMetrics[deviceId]['env_pm10'].push({value : envPmMessage.pm10, timestamp : envPmMessage.ts });
                deviceMetrics[deviceId]['env_temperature'].push({value : envPmMessage.temperature, timestamp : envPmMessage.ts });
                deviceMetrics[deviceId]['env_relative_humidity'].push({value : envPmMessage.relative_humidity, timestamp : envPmMessage.ts });
                deviceMetrics[deviceId]['env_pressure'].push({value : envPmMessage.pressure, timestamp : envPmMessage.ts });
                deviceLocation[deviceId] = envPmMessage.location;

            }
        }

        for (let deviceId in deviceMetrics) {
            if (deviceMetrics.hasOwnProperty(deviceId)) {
                for (let metricName in deviceMetrics[deviceId]) {
                    if (deviceMetrics[deviceId].hasOwnProperty(metricName) && deviceMetrics[deviceId][metricName].length > 0) {
                        let pushRs = await pushTimeseries(
                            {
                                labels : {
                                    __name__ : metricName,
                                    project : "acs",
                                    site : process.env.ACS_SITE,
                                    deviceId : deviceId,
                                    location : deviceLocation[deviceId]
                                },
                                samples : deviceMetrics[deviceId][metricName]
                            },
                            {
                                url : process.env.PROMETHEUS_RW_URL,
                                fetch : fetch,
                                headers: {
                                    "X-Scope-OrgID": process.env.ACS_ORG_ID
                                }
                            }
                        );

                        if (pushRs.errorMessage) {
                            console.warn(pushRs);
                        }
                    }
                }
            }
        }

        if (messages.length) {
            await sqsClient.send(new DeleteMessageBatchCommand({
                QueueUrl: process.env.SQS_POWER_URL,
                Entries : messages.map(function (message) {
                    return {
                        Id : message.MessageId,
                        ReceiptHandle : message.ReceiptHandle
                    }
                })
            }));
        }

        console.log("Processed", messages.length);
    }

})().then(function () {
    process.exit(0);
}).catch(function (e) {
    console.log(e, e.stack);
    process.exit(1);
})

function envPmMetrics() {
    return {
        "env_pm1" : [],
        "env_pm2_5" : [],
        "env_pm10" : [],
        "env_temperature" : [],
        "env_relative_humidity" : [],
        "env_pressure" : []
    };
}
