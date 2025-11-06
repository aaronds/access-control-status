import { decodeMac, modeEnumToString } from './decode-helpers.js'

export default function decodeEnvPmByVersion(message) {
    let version = "0";
    let payload = message.payloadBytes;
    let buffer = payload.buffer.slice(payload.byteOffset, payload.byteLength + payload.byteOffset);

    switch (version) {
        default:
            return v0(buffer);
            break;
    }

    function v0 (buffer) {
        let dv = new DataView(buffer);
        let mac = decodeMac(dv);
        let offset = 6;

        let res = {
            id : mac,
            pm1 : 0,
            pm2_5 : 0,
            pm10 : 0,
            temperature : 0,
            relative_humidity : 0,
            pressure : 0,
            location : 0
        }

        res.pm1 = dv.getUint16(offset, true);
        offset += 4;

        res.pm2_5 = dv.getUint16(offset, true);
        offset +=4;

        res.pm10 = dv.getUint16(offset, true);
        offset +=4;

        res.temperature = dv.getInt16(offset, true) / 100;
        offset +=4;

        res.relative_humidity = dv.getUint16(offset, true) / 100;
        offset +=4;

        res.pressure = dv.getUint16(offset, true);
        offset +=4;

        res.location = getLocation(dv.getUint16(offset, true));

        return res;

    }

    function getLocation(locationId) {

        switch(locationId) {
            case 110:
                return "woodshop/main";
            default:
                return "Unknown";
        }
    }
}
