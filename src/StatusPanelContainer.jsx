import { useState, useEffect} from 'react';

import StatusPanelDisplay from './StatusPanelDisplay.jsx';

export default function StatusPanelContainer(props) {
    const [status, setStatus] = useState("INITIALISING");
    const [led, setLed] = useState("off");
    const [isOn, setIsOn] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(1);
    const [power, setPower] = useState(0);
    const [freq, setFreq] = useState(0.0);

    const eventRef = props.eventRef;
    const id = props.id;
    const name = props.name;

    useEffect(function () {
        let offlineTimer = null;

        function onOffline() {
            setLed("offline");
            setStatus("OFFLINE");
        }

        function modeUpdate(mode) {
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

        eventRef.current.on(id + ".mode", modeUpdate);
        eventRef.current.on(id + ".power", powerUpdate);
        offlineTimer = setTimeout(onOffline,30100);

        return function () {
            eventRef.current.off(id + ".mode", modeUpdate);
            eventRef.current.off(id + ".power", powerUpdate);
            clearTimeout(offlineTimer);
        }
    }, [status, led, isOn, timeRemaining]);

    return <StatusPanelDisplay 
        id={id}
        name={name || id}
        led={led}
        isOn={isOn}
        timeRemaining={timeRemaining}
        power={power}
        freq={freq}
        status={status} />
}
