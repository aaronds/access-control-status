import { createSocket } from 'dgram'
import { decodeMac } from '../src/decode-helpers.js'
import modeEnumToString from '../src/mode-enum-to-string.js'

const PORT = 31883
const server = createSocket('udp4')

server.on('error', (err) => {
  console.error('Listening error:', err)
  server.close()
})

server.on('message', (msg, remoteInfo) => {
    let buffer = new Uint8Array(msg).buffer;
    let utf8Decoder = new TextDecoder(); 
    let mqttSnDv = new DataView(buffer);

    //TODO: Check MQTT message type, QOS and topic format.

    let topicLength = (mqttSnDv.getUint8(3) << 8) + mqttSnDv.getUint8(4);
    let topic = utf8Decoder.decode(buffer.slice(7, 7 + topicLength));

    console.log(topic);

    if (topic.startsWith('acs/b/mode')) {
        let dv = new DataView(buffer.slice(7 + topicLength));
        let mac = decodeMac(dv);
        let offset = 6;
        let mode, flags = null;

        mode = modeEnumToString(dv.getUint8(offset));
        offset += 4;

        flags = dv.getUint8(offset);

        let res = {
            id : mac,
            mode : mode,
            flags : {
                isOn : (flags & 1) > 0,
                isUsed : (flags & 2) > 0,
                monitorEnabled : (flags & 4) > 0,
                nfcEnabled : (flags & 8) > 0,
                isObserver : (flags & 16) > 0,
                modeChange : (flags & 32) > 0
            }
        };

        console.log(`Message from ${remoteInfo.address}:${remoteInfo.port}:`, res)
    }
})

server.on('listening', () => {
  const serverAddress = server.address()

  console.log(`Listening at ${serverAddress.address}:${serverAddress.port}`)
})

server.bind(PORT)
