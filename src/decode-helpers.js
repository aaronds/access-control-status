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
