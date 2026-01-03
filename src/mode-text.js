export default function modeToText(mode) {
    switch (mode.mode) {
        case "CONTROLLER_MODE_LOCKED":
            if (mode.isObserver) {
                return "OFF";
            } else {
                return "AVAILABLE";
            }
            break;
        case "CONTROLLER_MODE_UNLOCKED":
            if (mode.isObserver) {
                return "ON"
            }

            if (mode.monitorEnabled) {
                if (mode.isUsed) {
                    return "FINISHED";
                } else {
                    return "WAITING";
                }
            } else {
                return "UNLOCKED";
            }
            break;
        case "CONTROLLER_MODE_IN_USE":
            return "IN USE";
        default:
            return mode.mode.replace(/^CONTROLLER_MODE_/,"").replace(/_/, " ");
    }
}
