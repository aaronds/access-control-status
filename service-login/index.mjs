import moment from "moment"
import { HmacSHA256, SHA256, enc } from 'crypto-js'
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

export async function handler(event) {
    
    let rv = {
        ok : false
    };

    if (event.password && event.password === process.env.password) {
        let clientId = "web-" + Date.now() "-" + Math.round(Math.random() * 100000)
        let stsClient = new STSClien({});
        let webClientRole = await stsClient.send(new AssumeRoleCommand({ RoleArn : process.env.webClientRole, RoleSessionName : clientId }));

        rv.ok = true;
        rv.mqttUrl = urlWithSecret(clientId, stsClient.Credentials.AccessKeyId, stsClient.Credentials.SecretAccessKey, stsClient.Credentials.SessionToken);
    }

    return rv;
}



function urlWithSecret(clientId, accessKeyId, secretAccessKey, sessionToken) {

    const applicationData = {
        clientId: ,
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        sessionToken: sessionToken,
        region: "eu-west-2",
        endpoint: process.env.endpoint,
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

    function getSessionUrl() {
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

        return 'wss://' + host + canonicalUri + '?' + canonicalQuerystring;
    }

    return getSessionUrl();
}

