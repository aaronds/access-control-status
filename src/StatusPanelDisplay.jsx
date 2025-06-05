import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import './StatusPanel.css'
import screwA from './assets/Screw_a.svg';
import screwB from './assets/Screw_b.svg';

export default function StatusPanelDisplay(props) {
    let { id, name, led, isOn, timeRemaining, status, power, freq } = props;

    let ledStyle = {fill : "black"};

    switch (led) {
        case "on":
            ledStyle = {fill : "hsl(0 100% 60%)"}
            break;

        case "breathe":
           ledStyle = { "animation" : "breathe 6s infinite" }
           break;
        
        case "off":
            ledStyle = {fill : "hsl(0 100% 36%)"}
            break;

        case "offline":
            ledStyle = {fill : "hsl(0 100% 0%)"}
            break;
        default:
            break;
    }

    var timerCircleRadius = 7;
    var timerCircleLength = Math.PI * 2 * timerCircleRadius;
    var timerCircleOn = Math.min(timeRemaining, 1) * timerCircleLength;
    var timerCircleOff = timerCircleLength - timerCircleOn;



    return <Col style={{borderRadius: "3px", border: "1px solid #bbb", background: "#ddd"}} className="mx-1">
        <Row>
            <Col className="d-none d-md-block" md={2}>
                <img src={screwB} style={{"width" : "1em", rotate: "-45deg"}} />
            </Col>
            <Col xs={12} md={8}>
                <h3 style={{fontFamily: '"Anybody", sans-serif', fontWeight: "300", textTransform: "uppercase"}}>{name}</h3>
            </Col>
            <Col className="d-none d-md-block" md={2}>
                <img src={screwB} style={{"width" : "1em", rotate: "45deg"}}/>
            </Col>
        </Row>
        <Row>
            <Col xs={12}>
                <svg width = "100%" viewBox="0 0 50 6.4" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="25" cy="3.2" r="3.2" style={ledStyle} />
                </svg>
            </Col>
        </Row>
        <Row>
            <Col xs={12}>
                <p>&nbsp;</p>
                <p>&nbsp;</p>
            </Col>
        </Row>
        <Row>
            <Col xs={12}>
                <svg width = "90" viewBox="0 0 20.2 20.2" xmlns="http://www.w3.org/2000/svg" style={{cursor: "no-allowed"}} className="d-none d-md-inline">
                    <circle cx="10.1" cy="10.1" r="10.1" fill="#424242" />
                    {timeRemaining < 1 ? <circle cx="10.1" cy="10.1" r="7" fill="none" stroke="#FCEF91" stroke-dasharray={timerCircleOn + " " + timerCircleOff} stroke-linecap="round"/> : null }
                </svg>
                <p>{status}</p>
            </Col>
        </Row>
        <Row>
            <Col xs={12}>
                <svg width = "100%" viewBox="0 0 50 10.8" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="25" cy="5.4" fill={isOn ? "hsl(28 100% 50.6%)" : "hsl(28 100% 20.6%)"} r="5.4" />
                </svg>
            </Col>
        </Row>
        <Row style={{paddingBottom: "0.25em"}}>
            <Col className="d-none d-md-block" md={2}>
                <img src={screwB} style={{"width" : "1em", rotate: "45deg"}} />
            </Col>
            <Col xs={12} md={8}>
                {power > 0.01 ? power + "Kw" : null } {freq > 0.01 ? freq.toFixed(2) + "Hz" : null}
            </Col>
            <Col className="d-none d-md-block" md={2}>
                <img src={screwB} style={{"width" : "1em", rotate: "-45deg"}}/>
            </Col>
        </Row>
    </Col>
}
