import { ReceiveMessageCommand, DeleteMessageCommand, SQSClient, DeleteMessageBatchCommand } from "@aws-sdk/client-sqs";
import { pushTimeseries } from "prometheus-remote-write";

const sqsClient = new SQSClient({});

(async function pullMode() {

    while (true) {        
        let deviceMetrics = {
        };

        let result = await sqsClient.send(new ReceiveMessageCommand({
            MaxNumberOfMessages: 2,
            QueueUrl: process.env.SQS_ERROR_URL,
            WaitTimeSeconds: 20,
            VisibilityTimeout: 20
        }));

        let messages = result.Messages;

        if (!messages) {
            continue;
        }

        for (let message of messages) {
            let errorMessages = JSON.parse(message.Body);

            for (let errorMessage of errorMessages) {

                let deviceId = errorMessage.id;

                if (!deviceMetrics[deviceId]) {
                    deviceMetrics[deviceId] = errorMetrics();
                }

                deviceMetrics[deviceId]['acs_metric_error'].push({value : 1, timestamp : errorMessage.ts, tag : errorMessage.tag, error : errorMessage.error });
            }
        }

        for (let deviceId in deviceMetrics) {
            if (deviceMetrics.hasOwnProperty(deviceId)) {
                for (let metricName in deviceMetrics[deviceId]) {
                    if (deviceMetrics[deviceId].hasOwnProperty(metricName) && deviceMetrics[deviceId][metricName].length > 0) {

                        let tag = null;
                        let error = null;
                        let samples = [];

                        for (let sample of deviceMetrics[deviceId][metricName]) {
                            if (tag == sample.tag && error == sample.error) {
                                samples.push(sample);
                            } else {
                                if (samples.length > 0) {
                                    await pushTimeseries(
                                        {
                                            labels : {
                                                __name__ : metricName,
                                                project : "acs",
                                                site : process.env.ACS_SITE,
                                                deviceId : deviceId,
                                                tag : tag,
                                                error : error
                                            },
                                            samples : samples
                                        },
                                        {
                                            url : process.env.PROMETHEUS_RW_URL,
                                            fetch : fetch,
                                            headers: {
                                                "X-Scope-OrgID": process.env.ACS_ORG_ID
                                            }
                                        }
                                    );
                                }

                                tag = sample.tag;
                                error = sample.error;
                                samples = [sample];

                            }
                        }

                        if (samples.length > 0) {
                            await pushTimeseries(
                                {
                                    labels : {
                                        __name__ : metricName,
                                        project : "acs",
                                        site : process.env.ACS_SITE,
                                        deviceId : deviceId
                                        tag : tag,
                                        error : error
                                    },
                                    samples : samples
                                },
                                {
                                    url : process.env.PROMETHEUS_RW_URL,
                                    fetch : fetch,
                                    headers: {
                                        "X-Scope-OrgID": process.env.ACS_ORG_ID
                                    }
                                }
                            );
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
