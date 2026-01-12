import Pull from './pull-amqp-queue.mjs';
import { pushTimeseries } from "prometheus-remote-write";

(async function pullMode() {
    let pull = null,
        batch = null;

    pull = new Pull(process.env.AMQP_MODE_QUEUE,null, { timeout : 5000, count : 20 });

    let qChannel = await pull.connect();

    console.log("Connected to queue:", process.env.AMQP_MODE_QUEUE);

    while (true) {        
        let deviceMetrics = {
        };

        let messages = await pull.batch.get(); 

        if (!messages || messages.length < 1) {
            continue;
        }

        for (let message of messages) {
            let modeMessage = JSON.parse(message.content.toString());

            let deviceId = modeMessage.id;

            if (!deviceMetrics[deviceId]) {
                deviceMetrics[deviceId] = modeMetrics();
            }

            deviceMetrics[deviceId]['acs_metric_unlocked'].push({value : ['CONTROLLER_MODE_UNLOCKED', 'CONTROLLER_MODE_IN_USE'].indexOf(modeMessage.mode) >= 0 ? 1 : 0, timestamp : modeMessage.ts });
            deviceMetrics[deviceId]['acs_metric_inUse'].push({value : ['CONTROLLER_MODE_IN_USE'].indexOf(modeMessage.mode) >= 0 ? 1 : 0, timestamp : modeMessage.ts });
            deviceMetrics[deviceId]['acs_metric_energyTotal'].push({value : (modeMessage.energyTotal || 0), timestamp : modeMessage.ts });
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
                                    deviceId : deviceId
                                },
                                samples : deviceMetrics[deviceId][metricName]
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
                        
                        if (pushRs.errorMessage) {
                            console.warn(pushRs);
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

function modeMetrics() {
    return {
        "acs_metric_unlocked" : [],
        "acs_metric_inUse" : [],
        "acs_metric_energyTotal" : []
    };
}
