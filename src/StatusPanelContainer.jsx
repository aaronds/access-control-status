import { useState, useEffect} from 'react';

import StatusPanelDisplay from './StatusPanelDisplay.jsx';
import StatusPanelJson from './StatusPanelJson.jsx';
import { convertError } from './decode-helpers.js';


export default function StatusPanelContainer(props) {
    const [status, setStatus] = useState("INITIALISING");
    const [led, setLed] = useState("off");
    const [isOn, setIsOn] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(1);
    const [power, setPower] = useState(0);
    const [freq, setFreq] = useState(0.0);
    const [menuMode, setMenuMode] = useState("icons");
    const [device, setDevice] = useState(props.device || {});
    const [modeMessage, setModeMessage] = useState({});
    const [powerMessage, setPowerMessage] = useState({});
    const [errorTime, setErrorTime] = useState(0);
    const [errorTag, setErrorTag] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const eventRef = props.eventRef;
    const editDevice = props.editDevice;
    const id = props.id;
    const name = props.name;
    const initialMode = props.mode;

    function clearError() {
        setErrorTime(0);
        setErrorTag("");
        setErrorMessage("");
    }

    useEffect(function () {
        let offlineTimer = null;
        let errorTimer = null;

        function onOffline() {
            setLed("offline");
            setStatus("OFFLINE");
        }

        function modeUpdate(mode) {
            let modeText = mode.mode.replace(/^CONTROLLER_MODE_/,"").replace(/_/, " ");

            setStatus(modeText);
            setModeMessage(mode);

            switch(mode.mode) {
                case "CONTROLLER_MODE_UNLOCKED":
                case "CONTROLLER_MODE_IN_USE":
                    setLed("off");
                    break;

                case "CONTROLLER_MODE_LOCKED":
                    setLed("breathe");
                    break;

                default:
                    setLed("on");
                    break;
            }

            if (mode.monitorEnabled) {
                setIsOn(mode.isOn);
            } else {
                setIsOn(mode.mode == 'CONTROLLER_MODE_UNLOCKED');
            }

            if (mode.mode == "CONTROLLER_MODE_UNLOCKED" && mode.unlockedTimeout > 0 && mode.timeRemaining < mode.unlockedTimeout) {
                setTimeRemaining(mode.timeRemaining / mode.unlockedTimeout);
            } else {
                setTimeRemaining(1);
            }

            if (offlineTimer) {
                clearTimeout(offlineTimer);
                offlineTimer = setTimeout(onOffline,30100);
            }
        }

        function powerUpdate(power) {
            setIsOn(power.isOn);
            setPowerMessage(power);
            if (power.zx > 1) {
                let freq = (power.zx / (power.time / 1000000)) / 2;
                setFreq(freq);
            } else {
                setFreq(0.0);
            }

            if (offlineTimer) {
                clearTimeout(offlineTimer);
                offlineTimer = setTimeout(onOffline,30100);
            }
            setPower(power.power);
        }

        function errorUpdate(error) {
            console.warn(error.id, error);

            let errorDefine = convertError(error);

            if (!errorDefine) {
                return;
            }

            setErrorTime(Date.now());
            setErrorTag(errorDefine.tag.replace(/ACS_ERROR_/,""));
            setErrorMessage(errorDefine.error.replace(/_/g," "));

            if (errorTimer) {
                clearTimeout(errorTimer);
            }

            errorTimer = setTimeout(function () {
                clearError();
            }, 20000);

            if (offlineTimer) {
                clearTimeout(offlineTimer);
                offlineTimer = setTimeout(onOffline,30100);
            }
        }

        eventRef.current.on(id + ".mode", modeUpdate);
        eventRef.current.on(id + ".power", powerUpdate);
        eventRef.current.on(id + ".error", errorUpdate);

        offlineTimer = setTimeout(onOffline,30100);
        if (errorTime) {
            let errorTimeRemaining = 30000 - (Date.now() - errorTime);

            if (errorTimeRemaining > 0) {
                errorTimer = setTimeout(function () {
                    clearError();
                }, errorTimeRemaining);
            } else {
                clearError();
            }
        }

        return function () {
            eventRef.current.off(id + ".mode", modeUpdate);
            eventRef.current.off(id + ".power", powerUpdate);
            eventRef.current.off(id + ".error", errorUpdate);
            clearTimeout(offlineTimer);
            clearTimeout(errorTimer);
        }
    }, [status, led, isOn, timeRemaining]);

    useEffect(function () {
        if (initialMode) {
            let mode = initialMode;
            let modeText = mode.mode.replace(/^CONTROLLER_MODE_/,"").replace(/_/, " ");

            setStatus(modeText);

            switch(mode.mode) {
                case "CONTROLLER_MODE_UNLOCKED":
                case "CONTROLLER_MODE_IN_USE":
                    setLed("off");
                    break;

                case "CONTROLLER_MODE_LOCKED":
                    setLed("breathe");
                    break;

                default:
                    setLed("on");
                    break;
            }

            if (mode.monitorEnabled) {
                setIsOn(mode.isOn);
            } else {
                setIsOn(mode.mode == 'CONTROLLER_MODE_UNLOCKED');
            }
        }
    }, [initialMode]);

    function updateMotd(val) {
        let newDevice = Object.assign({}, device, val);
        setDevice(newDevice);
    }

    async function submitMotd() {
        return editDevice(device.id, device);
    }

    function cancelMotd() {
        setDevice(props.device);
    }

    switch (menuMode) {
        case "json":
            return <StatusPanelJson device={device} modeMessage={modeMessage} powerMessage={powerMessage} setMenuMode={setMenuMode}/>;
        default:
            return <StatusPanelDisplay 
                id={id}
                name={name || id}
                led={led}
                isOn={isOn}
                isObserver={modeMessage.isObserver}
                timeRemaining={timeRemaining}
                power={power}
                freq={freq}
                status={status}
                menuMode={menuMode}
                setMenuMode={setMenuMode}
                motdLine1={device.motdLine1}
                motdLine2={device.motdLine2}
                motdLink={device.motdLink}
                updateMotd={updateMotd}
                submitMotd={submitMotd}
                cancelMotd={cancelMotd}
                errorTag={errorTag}
                errorMessage={errorMessage}
                />
    }
}
