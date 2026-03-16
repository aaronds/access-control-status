import Pull from './pull-amqp-queue.mjs';
import { pushTimeseries } from "prometheus-remote-write";

(async function pullMode() {
    
    let pull = new Pull(process.env.AMQP_ERROR_QUEUE,null, { timeout : 5000, count : 60 });
    let qChannel = await pull.connect();
    
    console.log("Connected to queue:", process.env.AMQP_ERROR_QUEUE);

    while (true) {        
        let deviceMetrics = {
        };
        
        let messages = await pull.batch.get(); 

        if (!messages) {
            continue;
        }

        for (let message of messages) {
            let errorMessageOrMultiple = JSON.parse(message.content.toString());
            let messages = [];

            if (typeof errorMessageOrMultiple.forEach == "function") {
                messages = errorMessageOrMultiple;
            } else {
                messages = [errorMessageOrMultiple];
            }

            for (let errorMessage in messages) {
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
                                                "X-Scope-OrgID": process.env.ACS_ORG_ID,
                                                "X-Api-Token": process.env.PROMETHEUS_JWT_TOKEN
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
                                        "X-Scope-OrgID": process.env.ACS_ORG_ID,
                                        "X-Api-Token": process.env.PROMETHEUS_JWT_TOKEN
                                    }
                                }
                            );
                        }
                    }
                }
            }
        }

        if (messages.length) {
            messages.forEach(function (msg) {
                qChannel.ack(msg);
            });
        }

        console.log("Processed", messages.length);
    }

})().then(function () {
    process.exit(0);
}).catch(function (e) {
    console.log(e, e.stack);
    process.exit(1);
})

function errorMetrics() {
    return {
        "acs_metric_error" : []
    };
}
