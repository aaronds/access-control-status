import Pull from './pull-amqp-queue.mjs';
import { pushTimeseries } from "prometheus-remote-write";

(async function pullEnvPm() {
    
    let pull = new Pull(process.env.AMQP_ENV_PM_QUEUE, null, { timeout : 5000, count : 60 });
    let qChannel = await pull.connect();
    
    console.log("Connected to queue:", process.env.AMQP_ENV_PM_QUEUE);

    while (true) {        
        let deviceMetrics = {
        };
        let deviceLocation = {
        };
        
        let messages = await pull.batch.get(); 

        for (let message of messages) {
            let envPmMessageOrMultiple = JSON.parse(message.content.toString());
            let messages = [];

            if (typeof envPmMessageOrMultiple.forEach == "function") {
                messages = envPmMessageOrMultiple;
            } else {
                messages = [envPmMessageOrMultiple];
            }

            for (let envPmMessage in messages) {
                let deviceId = envPmMessage.id;

                if (!deviceMetrics[deviceId]) {
                    deviceMetrics[deviceId] = envPmMetrics();
                }

                if (envPmMessage.pm1 + envPmMessage.pm2_5 + envPmMessage.pm10 > 0) {
                    deviceMetrics[deviceId]['env_pm1'].push({value : envPmMessage.pm1, timestamp : envPmMessage.ts });
                    deviceMetrics[deviceId]['env_pm2_5'].push({value : envPmMessage.pm2_5, timestamp : envPmMessage.ts });
                    deviceMetrics[deviceId]['env_pm10'].push({value : envPmMessage.pm10, timestamp : envPmMessage.ts });
                }

                deviceMetrics[deviceId]['env_temperature'].push({value : envPmMessage.temperature, timestamp : envPmMessage.ts });
                deviceMetrics[deviceId]['env_relative_humidity'].push({value : envPmMessage.relative_humidity, timestamp : envPmMessage.ts });
                deviceMetrics[deviceId]['env_pressure'].push({value : envPmMessage.pressure, timestamp : envPmMessage.ts });
                deviceMetrics[deviceId]['env_pm_obstructed'].push({value : (envPmMessage.flags || {}).obstructed ? 1 : 0, timestamp : envPmMessage.ts });
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
                                    project : "env",
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

function envPmMetrics() {
    return {
        "env_pm1" : [],
        "env_pm2_5" : [],
        "env_pm10" : [],
        "env_temperature" : [],
        "env_relative_humidity" : [],
        "env_pressure" : [],
        "env_pm_obstructed": []
    };
}
