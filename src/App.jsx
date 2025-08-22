import { useState, useEffect, useRef } from 'react';
import './App.css';
import StatusPanelContainer from './StatusPanelContainer';


import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

import EventEmitter from 'eventemitter2';

import connectWithSecret from './aws-connect-with-secret';
import connectWithUrl from './mqtt-connect-with-url';
import decodePower from './decode-power';
import decodeMode from './decode-mode';
import decodeError from './decode-error';

const loginServiceUrl = "https://zipkxue6v77d7eku7viagzdrpm0odwkx.lambda-url.eu-west-2.on.aws/";
const editServiceUrl = "https://avlyeh6dbkyueahzwkiqta2j7a0vsmfu.lambda-url.eu-west-2.on.aws/";

const LOCAL_STORAGE_SECRET_KEY = "bhs-acs-secret"


function App() {
    const [ready, setReady] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [secret, setSecret] = useState("");
    const [devices, setDevices] = useState([]);
    const [advanced, setAdvanced] = useState(false);


    let mqtt = useRef(null);
    let events = useRef(null);

    let onChangeSecret = (e) => {
        setSecret(e.target.value);
    }

    let onClickConnect = (e) => {
        e.preventDefault();
        setLoading(true);
        setError(false);
        tryToConnect(secret);
    }

    useEffect(function () {
        if (typeof localStorage != "object") {
            return
        }

        let secretLS = localStorage.getItem(LOCAL_STORAGE_SECRET_KEY);

        if (secretLS) {
            setSecret(secretLS);
            setLoading(true);
            tryToConnect(secretLS);
        }

    },[])

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

            if (typeof localStorage == "object") {
                localStorage.setItem(LOCAL_STORAGE_SECRET_KEY, password);
            }

            initialDevices = await fetchJson(result.statusUrl);
            setDevices(initialDevices.slice());

            mqttClient = await connectWithUrl(result.mqttUrl, result.clientId)
        } catch (e) {
            setLoading(false);
            setError(e.message);
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
                        newOrEmit(powerMessage.id, "power", powerMessage);
                        break;

                    case "mode":
                        let modeMessage = decodeMode(message);
                        newOrEmit(modeMessage.id, "mode", modeMessage);
                        break;

                    case "error":
                        let errorMessage = decodeError(message);
                        newOrEmit(errorMessage.id, "error", errorMessage);
                        break;
                }
            } catch (e) {
                console.log(e, e.stack);
            }
        }

        mqttClient.onConnectionLost = function (e) {
            console.warn(e, e.stack);
            setReady(false);

            if (secret) {
                tryToConnect(secret);
                setLoading(true); 
            }
        }

        if (mqttClient) {
            await mqttClient.subscribe("acs/message/power/#");
            await mqttClient.subscribe("acs/message/mode/#");
            await mqttClient.subscribe("acs/message/error/#");
            setReady(true);
        }

        setLoading(false);

        function newOrEmit(id, messageType, message) {
            if (clientsSeen.indexOf(id) < 0) {
                clientsSeen.push(id);
                events.current.emit("new", { id : id });
                setTimeout(function () {
                    events.current.emit(id + "." + messageType, message); 
                }, 100);

            } else {
                events.current.emit(id + "." + messageType, message); 
            }
        }
    }

    async function editDevice(id, value) {
        let result = await editPostJson({
            "id": id,
            "password" : secret,
            "device" : value
        });

        return result;
    }

    devices.sort(function (a, b) {
        if (a.name == b.name) {
            return (a.id || "").localeCompare(b.id || "");
        } else {
            return (a.name || "").localeCompare(b.name || "");
        }
    });

    let groups = {};
    let noGroup = [];

    for (let device of devices) {
        if (device.group) {
            if (!groups[device.group]) {
                groups[device.group] = [];
            }
            groups[device.group].push(device);
        } else {
            noGroup.push(device);
        }
    }

    let groupNames = Object.keys(groups);
    groupNames.sort();

    return (
        <>
            { ready ? 
                <Container className={advanced ? "show-advanced" : "hide-advanced"}>
                    <Row className="d-lg-none">
                        <Col xs={6}>
                            <p className="d-block d-md-none">Jump to:</p>
                            <ul className="d-block d-md-none">
                                {groupNames.map(function (groupName) {
                                    return <li><a href={"#" + groupName}>{groupName}</a></li>
                                })}
                            </ul>
                        </Col>
                        <Col className="text-end" xs={6}>
                                <ToggleButton 
                                    type="checkbox"
                                    variant="secondary"
                                    checked={advanced}
                                    value={true}
                                    onClick={(e) => setAdvanced(!advanced)}>
                                    More Buttons
                                </ToggleButton>
                        </Col>
                    </Row>
                    {groupNames.map(function (groupName) {
                        return <section key={groupName}>
                            <Row><h2>{groupName}</h2></Row>
                            <Row id={groupName}>
                                {groups[groupName].map(function (device) {
                                    return <StatusPanelContainer key={device.id} id={device.id} name={device.name} eventRef={events} mode={device.mode} device={device} editDevice={editDevice} />
                                })}
                            </Row>
                        </section>
                    })}
                    <Row className="gx-0">
                        {(noGroup || []).map(function (device) {
                            return <StatusPanelContainer key={device.id} id={device.id} name={device.name} eventRef={events} mode={device.mode} device={device} editDevice={editDevice} />
                        })}
                    </Row>
                </Container>
                : 
                <Container>
                    <p className="text-start">Check the members only section of the wiki for the password.</p>
                    { error ? <Alert variant="danger">{error}</Alert> : null }
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

    function editPostJson(obj) {
        return fetch(
            editServiceUrl, 
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
                throw new Error("Edit POST error:" + response.status);
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
