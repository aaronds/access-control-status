import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function handler(event) {
    
    let rv = {
        ok : false
    };

    let body = {};

    console.log(event);

    if (event.password) {
        body = event;
    } else {
        body = JSON.parse(event.body);
    }
    
    if (body.password && body.password !== process.env.password) {
        rv.error = "Password error";
        return rv;
    }

    if (!body.id) {
        rv.error = "No device ID";
        return rv;
    }

    if (!body.device) {
        rv.error = "No device data";
        return rv;
    }

    let s3Client = new S3Client({});
    let currentStatusRes = await s3Client.send(new GetObjectCommand({ Bucket : process.env.statusBucket, Key : process.env.statusKey }));
    let currentStatus = JSON.parse(await currentStatusRes.Body.transformToString());

    let device = currentStatus.find((d) => d.id == body.id);

    if (!device) {
        rv.error = "Device not found.";
        return rv;
    }

    Object.keys(body.device).forEach(function (key) {
        if (["id", "mode"].indexOf(key) >= 0) {
            return;
        }

        device[key] = body.device[key];
    })
    
    await s3Client.send(new PutObjectCommand({ Bucket : process.env.statusBucket, Key : process.env.statusKey, Body : JSON.stringify(currentStatus)}));

    rv.ok = true;
    rv.device = device;
    return rv;
}
