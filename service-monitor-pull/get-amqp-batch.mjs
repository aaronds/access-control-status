export default function Batch(channel, queue, options) {
    let pendingMessages = [];
    let pendingGet = [];

    let timeout = options.timeout || 0;
    let count = options.count;

    this.get = async function () {
        let start = Date.now();
        let messages = [];


        while (messages.length < count && (timeout > 0 ? Date.now() - start < timeout : true)) {
            let message = await channel.get(queue);

            if (message) {
                messages.push(message);
            } else {
                await new Promise(function (accept) { setTimeout(accept, 100) });
            }
        }

        return messages;
    }
}
