import { useState, useEffect, useRef } from 'react'
import './App.css'
import StatusPanelContainer from './StatusPanelContainer'

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import EventEmitter from 'eventemitter2';

import connectWithSecret from './aws-connect-with-secret';
import connectWithUrl from './mqtt-connect-with-url';
import decodePower from './decode-power';
import decodeMode from './decode-mode';

const loginServiceUrl = "https://zipkxue6v77d7eku7viagzdrpm0odwkx.lambda-url.eu-west-2.on.aws/";



function App() {
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [secret, setSecret] = useState("");
    const [devices, setDevices] = useState(null);

    let mqtt = useRef(null);
    let events = useRef(null);

    let onChangeSecret = (e) => {
        setSecret(e.target.value);
    }

    let onClickConnect = (e) => {
        e.preventDefault();
        setLoading(true);
        tryToConnect(secret);
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



    async function tryToConnect(password) {
        let mqttClient = null;
        let clientsSeen = [];
        let initialDevices = [];

        try {
            let result = await loginPostJson({ "password" : password });

            if (!result.ok) {
                throw new Error("Login failed");
            }

            initialDevices = await fetchJson(result.statusUrl);
            setDevices(initialDevices.slice());

            mqttClient = await connectWithUrl(result.mqttUrl, result.clientId)
        } catch (e) {
            setLoading(false);
            console.warn(e);
            return;
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
                        {(devices || []).map(function (device) {
                            return <StatusPanelContainer key={device.id} id={device.id} name={device.name} eventRef={events} mode={device.mode} />
                        })}
                    </Row>
                </Container>
                : 
                <Container>
                    <p className="text-start">Check the members only section of the wiki for the password.</p>
                    <Form onSubmit={onClickConnect}>
                        <Form.Group className="mb-3" controlId="formBasicPassword">
                            <Form.Control type="password" placeholder="Password" value={secret} onChange={onChangeSecret} />
                        </Form.Group>
                        <Button variant="primary" type="submit" disabled={loading}>Connect</Button>
                    </Form>
                </Container>
            }
            </>
    )

    function loginPostJson(obj) {
        return fetch(
            loginServiceUrl, 
            {
                method : "POST",
                headers : {
                    'Content-Type' : 'application/json'
                },
                body : JSON.stringify(obj)
            }
        ).then(function (res) {
            if (res.ok) { 
                return res.json();
            } else { 
                throw new Error("Login POST error:" + response.status);
            }
        })
    }

    function fetchJson(url) {
        return fetch(
            url, 
            {
                method : "GET"
            }
        ).then(function (res) {
            if (res.ok) { 
                return res.json();
            } else { 
                throw new Error("Login POST error:" + response.status);
            }
        })
    }
}

export default App
