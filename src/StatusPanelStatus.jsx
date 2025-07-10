
export default function StatusPanelStatus(props) {
    let {timeRemaining, status, menuMode} = props;

    let timerCircleRadius = 7;
    let timerCircleLength = Math.PI * 2 * timerCircleRadius;
    let timerCircleOn = Math.min(timeRemaining, 1) * timerCircleLength;
    let timerCircleOff = timerCircleLength - timerCircleOn;
    let timerCircleOffset = 1.25 * timerCircleLength;

    switch (menuMode) {
        case "editMotd":
            return <p>{status}</p>;
        default:
            return <> 
                <svg width = "90" viewBox="0 0 20.2 20.2" xmlns="http://www.w3.org/2000/svg" style={{cursor: "not-allowed"}} className="d-none d-sm-inline">
                    <circle cx="10.1" cy="10.1" r="10.1" fill="#424242" />
                    {timeRemaining < 1 ? <circle cx="10.1" cy="10.1" r="7" fill="none" stroke="#FCEF91" stroke-dasharray={timerCircleOn + " " + timerCircleOff} stroke-dashoffset={timerCircleOffset} stroke-linecap="round"/> : null }
                </svg>
                <p>{status}</p>
            </>;
    }
}
