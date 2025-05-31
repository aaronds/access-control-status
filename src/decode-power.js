import { decodeMac } from './decode-helpers.js'

export default function decodePowerByVersion(message) {
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
            energy : 0,
            power : 0,
            time : 0,
            currentMax : 0,
            zx : 0,
            voltage : 0,
            voltageType : 0,
            isOn : false
        }

        res.energy = dv.getUint32(offset, true);
        offset += 4;

        res.power = dv.getUint32(offset, true);
        offset += 4;

        res.time = dv.getUint32(offset, true);
        offset += 4;

        res.currentMax = dv.getUint32(offset, true);
        offset += 4;

        res.zx = dv.getUint32(offset, true);
        offset += 4;

        res.voltage = dv.getUint16(offset, true);
        offset += 2;

        res.voltageType = dv.getUint8(offset, true);
        offset += 1; /* With padding */

        res.isOn = dv.getUint8(offset) > 0;

        return res;
    }
}
