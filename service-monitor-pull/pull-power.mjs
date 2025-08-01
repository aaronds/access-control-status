import { ReceiveMessageCommand, DeleteMessageCommand, SQSClient, DeleteMessageBatchCommand } from "@aws-sdk/client-sqs";
import { pushTimeseries } from "prometheus-remote-write";

const sqsClient = new SQSClient({});

(async function pullMode() {

    while (true) {        
        let deviceMetrics = {
        };

        let result = await sqsClient.send(new ReceiveMessageCommand({
            MaxNumberOfMessages: 2,
            QueueUrl: process.env.SQS_POWER_URL,
            WaitTimeSeconds: 20,
            VisibilityTimeout: 20
        }));

        let messages = result.Messages;

        if (!messages) {
            continue;
        }

        for (let message of messages) {
            let powerMessages = JSON.parse(message.Body);

            for (let powerMessage of powerMessages) {

                let deviceId = powerMessage.id;

                if (!deviceMetrics[deviceId]) {
                    deviceMetrics[deviceId] = powerMetrics();
                }

                deviceMetrics[deviceId]['acs_metric_power'].push({value : powerMessage.power, timestamp : powerMessage.ts });
                deviceMetrics[deviceId]['acs_metric_energy'].push({value : powerMessage.energy, timestamp : powerMessage.ts });
                deviceMetrics[deviceId]['acs_metric_isOn'].push({value : (powerMessage.isOn ? 1 : 0), timestamp : powerMessage.ts });
                deviceMetrics[deviceId]['acs_metric_frequency'].push({value : ((powerMessage.zx / (powerMessage.time / 1000000)) / 2), timestamp : powerMessage.ts });
                deviceMetrics[deviceId]['acs_metric_sampleTime'].push({value : powerMessage.time, timestamp : powerMessage.ts });
                deviceMetrics[deviceId]['acs_metric_zx'].push({value : powerMessage.zx, timestamp : powerMessage.ts });
                deviceMetrics[deviceId]['acs_metric_currentMax'].push({value : powerMessage.currentMax, timestamp : powerMessage.ts });

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

function powerMetrics() {
    return {
        "acs_metric_power" : [],
        "acs_metric_energy" : [],
        "acs_metric_isOn" : [],
        "acs_metric_frequency" : [],
        "acs_metric_sampleTime" : [],
        "acs_metric_zx" : [],
        "acs_metric_currentMax" : []
    };
}
