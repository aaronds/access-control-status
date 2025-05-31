import { useState, useEffect} from 'react';

import StatusPanelDisplay from './StatusPanelDisplay.jsx';

export default function StatusPanelContainer(props) {
    const [status, setStatus] = useState("INITIALISING");
    const [led, setLed] = useState("off");
    const [isOn, setIsOn] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(1);

    const eventRef = props.eventRef;
    const id = props.id;
    const name = props.name;

    useEffect(function () {
        function modeUpdate(mode) {
            let modeText = mode.mode.replace(/^CONTROLLER_MODE_/,"");
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
        }

        eventRef.current.on(id + ".mode", modeUpdate);

        return function () {
            eventRef.current.off(id + ".mode", modeUpdate);
        }
    }, [status, led, isOn, timeRemaining]);

    return <StatusPanelDisplay 
        id={id}
        name={name || id}
        led={led}
        isOn={isOn}
        timeRemining={timeRemaining}
        status={status} />
}
