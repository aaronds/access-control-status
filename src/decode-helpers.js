import { errorMetaData } from 'access-control-firmware';

export function convertError(error) {
    let tag = errorMetaData.tags.find((t) => t.value == error.tag);
    if (!tag) {
        return;
    }

    let errorMessage = tag.errors.find((e) => e.value == error.error);

    return {
        tag : tag.name,
        error : errorMessage?.name
    }
}

export function modeEnumToString(mode) {
    switch (mode) {
        case 0:
            return 'CONTROLLER_MODE_INITIALISING';
        case 1:
            return 'CONTROLLER_MODE_LOCKED';
        case 2:
            return 'CONTROLLER_MODE_UNLOCKED';
        case 3:
            return 'CONTROLLER_MODE_IN_USE';
        case 4:
            return 'CONTROLLER_MODE_AWAIT_INDUCTOR';
        case 5:
            return 'CONTROLLER_MODE_ENROLL';
        default:
            return 'CONTROLLER_MODE_UNKNOWN';
    }
}

export function decodeMac (dv) {
    let mac = "";

    for (let i = 0;i < 6;i++) {
        let macByte = dv.getUint8(i);
        let macHex = macByte.toString(16);

        if (macHex.length < 2) {
            mac = mac + '0' + macHex;
        } else {
            mac = mac + macHex;
        }
    }

    return mac;
}
