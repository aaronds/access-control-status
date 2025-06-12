import pahoMqtt from 'paho-mqtt';
const {Client, Message} = pahoMqtt;
import moment from "moment";
import  cryptoJs from 'crypto-js';
const { HmacSHA256, SHA256, enc } = cryptoJs;

export default function connectWithSecret(accessKey, secret, session, clientId) {

    const applicationData = {
        clientId: clientId,
        accessKeyId: accessKey,
        secretAccessKey: secret,
        sessionToken: session,
        region: "eu-west-2",
        endpoint: "a1j7mrp8z8zjsh-ats.iot.eu-west-2.amazonaws.com",
        topic: ""
    }

    // Helper functions to perform sigv4 operations
    function SigV4Utils(){}
    SigV4Utils.sign = function(key, msg){
      var hash = HmacSHA256(msg, key);
      return hash.toString(enc.Hex);
    };
    SigV4Utils.sha256 = function(msg) {
      var hash = SHA256(msg);
      return hash.toString(enc.Hex);
    };
    SigV4Utils.getSignatureKey = function(key, dateStamp, regionName, serviceName) {
      var kDate = HmacSHA256(dateStamp, 'AWS4' + key);
      var kRegion = HmacSHA256(regionName, kDate);
      var kService = HmacSHA256(serviceName, kRegion);
      var kSigning = HmacSHA256('aws4_request', kService);
      return kSigning;
    };

    function startSession() {
        // Get timestamp and format data
        var time = moment.utc();
        var dateStamp = time.format('YYYYMMDD');
        var amzdate = dateStamp + 'T' + time.format('HHmmss') + 'Z';
        // Define constants used to create the message to be signed
        var service = 'iotdevicegateway';
        var region = applicationData.region;
        var secretKey = applicationData.secretAccessKey
        var accessKey = applicationData.accessKeyId
        var algorithm = 'AWS4-HMAC-SHA256';
        var method = 'GET';
        var canonicalUri = '/mqtt';
        var host = applicationData.endpoint;

        // Set credential scope to today for a specific service in a specific region
        var credentialScope = dateStamp + '/' + region + '/' + service + '/' + 'aws4_request';
        // Start populating the query string
        var canonicalQuerystring = 'X-Amz-Algorithm=AWS4-HMAC-SHA256';
        // Add credential information
        canonicalQuerystring += '&X-Amz-Credential=' + encodeURIComponent(accessKey + '/' + credentialScope);
        // Add current date
        canonicalQuerystring += '&X-Amz-Date=' + amzdate;
        // Add expiry date
        canonicalQuerystring += '&X-Amz-Expires=86400';
        // Add headers, only using one = host
        canonicalQuerystring += '&X-Amz-SignedHeaders=host';
        var canonicalHeaders = 'host:' + host + '\n';
        // No payload, empty
        var payloadHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty string -> echo -n "" | xxd  | shasum -a 256
                                                                                              // Build canonical request
        var canonicalRequest = method + '\n' + canonicalUri + '\n' + canonicalQuerystring + '\n' + canonicalHeaders + '\nhost\n' + payloadHash;
        console.log('canonicalRequest: \n' + canonicalRequest);
        // Hash the canonical request and create the message to be signed
        var stringToSign = algorithm + '\n' +  amzdate + '\n' +  credentialScope + '\n' +  SigV4Utils.sha256(canonicalRequest);
        // Derive the key to be used for the signature based on the scoped down request
        var signingKey = SigV4Utils.getSignatureKey(secretKey, dateStamp, region, service);
        console.log('stringToSign: \n'); console.log(stringToSign);
        console.log('signingKey: \n'); console.log(signingKey);
        // Calculate signature
        var signature = SigV4Utils.sign(signingKey, stringToSign);
        // Append signature to message
        canonicalQuerystring += '&X-Amz-Signature=' + signature;
        // Append existing security token to the request (since we are using STS credetials) or do nothing if using IAM credentials
        if (applicationData.sessionToken !== "") {
            canonicalQuerystring += '&X-Amz-Security-Token=' + encodeURIComponent(applicationData.sessionToken);
        }
        var requestUrl = 'wss://' + host + canonicalUri + '?' + canonicalQuerystring;
        console.log(requestUrl);

        var mqtt_client = new Client(requestUrl, applicationData.clientId);
        /*
        mqtt_client.onMessageArrived = onMessageArrived;
        mqtt_client.onConnectionLost = onConnectionLost;
        */

        return new Promise(function (accept, reject) {
            mqtt_client.connect({
                onSuccess : function () { accept(mqtt_client) },
                onFailure : function (e) { reject(e) },
                useSSL : true,
                timeout: 3
            });
        });
    }

    return startSession();
}
