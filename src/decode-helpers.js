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
