import { Client, Message} from 'paho-mqtt'

export default function mqttConnectWithUrl(requestUrl, clientId) {
    var mqtt_client = new Client(requestUrl, clientId);

    return new Promise(function (accept, reject) {
        mqtt_client.connect({
            onSuccess : function () { accept(mqtt_client) },
            onFailure : function (e) { reject(e) },
            useSSL : true,
            timeout: 3
        });
    });
}
