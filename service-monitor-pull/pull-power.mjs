import Pull from './pull-amqp-queue.mjs';
import { pushTimeseries } from "prometheus-remote-write";

(async function pullMode() {

    let pull = new Pull(process.env.AMQP_POWER_QUEUE, null, { timeout : 5000, count : 60 });

    let qChannel = await pull.connect();

    console.log("Connected to queue:", process.env.AMQP_POWER_QUEUE);

    while (true) {        
        let deviceMetrics = {
        };
        
        let messages = await pull.batch.get(); 

        for (let message of messages) {
            let powerMessageOrMultiple = JSON.parse(message.content.toString());
            let messages = [];

            if (typeof powerMessageOrMultiple.forEach == "function") {
                messages = powerMessageOrMultiple;
            } else {
                messages = [powerMessageOrMultiple];
            }

            for (let powerMessage in messages) {

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
