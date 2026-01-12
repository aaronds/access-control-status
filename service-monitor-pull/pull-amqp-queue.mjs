import Batch from './get-amqp-batch.mjs'
import amqplib from 'amqplib';

export default function Pull(queue, pullOptions, batchOptions) {
    let qConnection = null;
    let qChannel = null;
    let batch = null;

    this.connect = async function () {

        let amqpOptions = {};
        let protocol = "amqp";

        if (process.env.AMQP_TLS_KEY_FILE) {
            amqpOptions.key = await readFile(process.env.AMQP_TLS_KEY_FILE); 
            amqpOptions.cert = await readFile(process.env.AMQP_TLS_CERT_FILE); 
            protocol = "amqps";
        }

        if (process.env.AMQP_TLS_CA_FILE) {
            amqpOptions.ca = [await readFile(process.env.AMQP_TLS_CA_FILE)]; 
            protocol = "amqps";
        }

        qConnection = await amqplib.connect(
            {
                protocal : "amqp",
                host: "localhost",
                username : "oauth2",
                password : process.env.AMQP_JWT_TOKEN
            },
            amqpOptions
        );

        qConnection.on('error', function (err) {
            console.warn(err, err.stack);
            process.exit(1);
        });

        qChannel = await qConnection.createChannel();
        qChannel.on('error', function (err) {
            console.warn(err, err.stack);
            process.exit(1);
        });

        this.batch = batch = new Batch(qChannel, queue, batchOptions);

        return qChannel;
    }
}

