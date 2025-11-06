export default function modeEnumToString(mode) {
    switch (mode) {
        case 0:
            return 'CONTROLLER_MODE_INITIALISING';
        case 1:
            return 'CONTROLLER_MODE_LOCKED';
        case 2:
            return 'CONTROLLER_MODE_UNLOCKED';
        case 3:
            return 'CONTROLLER_MODE_IN_USE';
        case 4:
            return 'CONTROLLER_MODE_AWAIT_INDUCTOR';
        case 5:
            return 'CONTROLLER_MODE_ENROLL';
        default:
            return 'CONTROLLER_MODE_UNKNOWN';
    }
}
