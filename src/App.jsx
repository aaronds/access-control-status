import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import StatusPanelContainer from './StatusPanelContainer'

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

import EventEmitter from 'eventemitter2';

import connectWithSecret from './aws-connect-with-secret';
import decodePower from './decode-power';
import decodeMode from './decode-mode';

let initialDevices = [
    {
        id : "30c6f7f4fe6c",
        name : "Development"
    }
]


function App() {
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [secret, setSecret] = useState("");
    const [devices, setDevices] = useState(initialDevices);

    let mqtt = useRef(null);
    let events = useRef(null);

    let onChangeSecret = (e) => {
        setSecret(e.target.value);
    }

    let onClickConnect = () => {
        setLoading(true);
        tryToConnect(secret);
        return false;
    }

    useEffect(function () {
        function addNewDevice(evt) {
            let newDevices = devices.slice();
            newDevices.push({ id : evt.id });
            setDevices(newDevices);
        }

        if (events.current) {
            events.current.on("new", addNewDevice);
        }

        return function () {
            if (events.current) {
                events.current.off("new", addNewDevice);
            }
        }
    }, [ready, devices]);



    async function tryToConnect(secret) {
        let mqttClient = null;
        let clientsSeen = [];
        try {
            mqttClient = await connectWithSecret(secret)
        } catch (e) {
            console.warn(e);
        }

        mqtt.current = mqttClient;
        events.current = new EventEmitter();

        initialDevices.forEach(function (device) {
            clientsSeen.push(device.id);
        });

        mqttClient.onMessageArrived = function (message) {
            try {
                let topic = message.topic;
                let messageType = topic.split("/")[2];

                switch(messageType) {
                    case "power":
                        let powerMessage = decodePower(message);

                        if (clientsSeen.indexOf(powerMessage.id) < 0) {
                            clientsSeen.push(powerMessage.id);
                            events.current.emit("new", { id : powerMessage.id });
                            setTimeout(function () {
                                events.current.emit(powerMessage.id + ".power", powerMessage); 
                            }, 100);

                        } else {
                            events.current.emit(powerMessage.id + ".power", powerMessage); 
                        }
                        
                        break;

                    case "mode":
                        let modeMessage = decodeMode(message);
                        if (clientsSeen.indexOf(modeMessage.id) < 0) {
                            clientsSeen.push(modeMessage.id);
                            events.current.emit("new", { id : modeMessage.id });
                            setTimeout(function () {
                                events.current.emit(modeMessage.id + ".mode", modeMessage); 
                            }, 100);

                        } else {
                            events.current.emit(modeMessage.id + ".mode", modeMessage); 
                        }

                        break;
                }
            } catch (e) {
                console.log(e, e.stack);
            }
        }

        mqttClient.onConnectionLost = function (e) {
            console.warn(e, e.stack);
            setReady(false);
            setLoading(false);
        }

        if (mqttClient) {
            await mqttClient.subscribe("acs/message/power/#");
            await mqttClient.subscribe("acs/message/mode/#");
            setReady(true);
        }

        setLoading(false);
    }

    return (
        <>
            { ready ? 
                <Container>
                    <Row className="gx-0">
                        {devices.map(function (device) {
                            return <StatusPanelContainer key={device.id} id={device.id} name={device.name} eventRef={events} />
                        })}
                    </Row>
                </Container>
                : 
                <>
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" placeholder="Password" value={secret} onChange={onChangeSecret} />
                    </Form.Group>
                    <Button variant="primary" type="submit" onClick={onClickConnect} disabled={loading}>Connect</Button>
                </>
            }
            </>
           )
}

export default App
