import { ReceiveMessageCommand, DeleteMessageCommand, SQSClient, DeleteMessageBatchCommand } from "@aws-sdk/client-sqs";
import { pushTimeseries } from "prometheus-remote-write";

const sqsClient = new SQSClient({});

(async function pullMode() {

    while (true) {        
        let deviceMetrics = {
        };

        let result = await sqsClient.send(new ReceiveMessageCommand({
            MaxNumberOfMessages: 2,
            QueueUrl: process.env.SQS_MODE_URL,
            WaitTimeSeconds: 20,
            VisibilityTimeout: 20
        }));

        let messages = result.Messages;

        if (!messages) {
            continue;
        }

        for (let message of messages) {
            let modeMessages = JSON.parse(message.Body);

            for (let modeMessage of modeMessages) {

                let deviceId = modeMessage.id;

                if (!deviceMetrics[deviceId]) {
                    deviceMetrics[deviceId] = modeMetrics();
                }

                deviceMetrics[deviceId]['acs_metric_unlocked'].push({value : ['CONTROLLER_MODE_UNLOCKED', 'CONTROLLER_MODE_IN_USE'].indexOf(modeMessage.mode) >= 0 ? 1 : 0, timestamp : modeMessage.ts });
                deviceMetrics[deviceId]['acs_metric_inUse'].push({value : ['CONTROLLER_MODE_IN_USE'].indexOf(modeMessage.mode) >= 0 ? 1 : 0, timestamp : modeMessage.ts });
                deviceMetrics[deviceId]['acs_metric_energyTotal'].push({value : (modeMessage.energyTotal || 0), timestamp : modeMessage.ts });
            }
        }

        for (let deviceId in deviceMetrics) {
            if (deviceMetrics.hasOwnProperty(deviceId)) {
                console.log(deviceMetrics[deviceId]);
                for (let metricName in deviceMetrics[deviceId]) {
                    if (deviceMetrics[deviceId].hasOwnProperty(metricName) && deviceMetrics[deviceId][metricName].length > 0) {
                        let pushRs = await pushTimeseries(
                            {
                                labels : {
                                    __name__ : metricName,
                                    project : "acs",
                                    site : process.env.ACS_SITE,
                                    deviceId : deviceId
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
                QueueUrl: process.env.SQS_MODE_URL,
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

function modeMetrics() {
    return {
        "acs_metric_unlocked" : [],
        "acs_metric_inUse" : [],
        "acs_metric_energyTotal" : []
    };
}
