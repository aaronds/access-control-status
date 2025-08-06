import { decodeMac } from './decode-helpers.js'
import modeEnumToString from './mode-enum-to-string.js'

export default function decodeModeByVersion(message) {
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
            mode : 'CONTROLLER_MODE_INITIALISING',
            isOn : false,
            isUsed : false,
            monitorEnabled : false,
            nfcEnabled : true,
            isObserver : false,
            timeRemaining : 0,
            unlockedTimeout : 0,
            energyTotal : 0
        };
        
        res.timeRemaining = dv.getUint32(offset, true);
        offset += 4;

        res.unlockedTimeout = dv.getUint32(offset, true);
        offset += 4;

        res.mode = modeEnumToString(dv.getUint8(offset));
        offset += 4;

        let flags = dv.getUint8(offset);

        res.isOn = (flags & 1) > 0; 
        res.isUsed = (flags & 2) > 0;
        res.monitorEnabled = (flags & 4) > 0;
        res.nfcEnabled = (flags & 8) > 0;
        res.isObserver = (flags & 16) > 0;

        if (dv.byteLength > 22) {
            offset += 4;
            res.energyTotal = dv.getUint32(offset, true);
        }

        return res;
    }

}
