import { decodeMac } from './decode-helpers.js'

export default function decodeErrorByVersion(message) {
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

        let error = {
            id : mac,
            tag : 0,
            error : 0
        };

        error.tag = dv.getUint16(offset, true);
        offset += 2;

        error.error = dv.getUint16(offset, true);
        offset +=2;

        return error;
    }
}
