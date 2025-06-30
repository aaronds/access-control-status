import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import './StatusPanel.css'
import screwA from './assets/Screw_a.svg';
import screwB from './assets/Screw_b.svg';

export default function StatusPanelDisplay(props) {
    let { id, name, led, isOn, timeRemaining, status, power, freq, motdLine1, motdLine2 } = props;

    let ledStyle = {fill : "black"};

    switch (led) {
        case "on":
            ledStyle = {fill : "hsl(0 100% 60%)"}
            break;

        case "breathe":
           ledStyle = { "animation" : "breathe 4s infinite" }
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
    var timerCircleOffset = 1.25 * timerCircleLength;



    return <Col sm={6} md={3} lg={3} xl={2} className = "acs-panel pb-4 text-center"><Container>
        <Col md={12} style={{borderRadius: "3px", border: "1px solid #bbb", background: "#ddd"}} className="mx-0">
            <Row className="acs-top">
                <Col className="d-none d-lg-block acs-screw" md={2}>
                    <img src={screwB} style={{}} />
                </Col>
                <Col xs={12} lg={8}>
                    <h3 style={{fontFamily: '"Anybody", sans-serif', fontWeight: "300", textTransform: "uppercase"}}>{name}</h3>
                </Col>
                <Col className="d-none d-lg-block acs-screw" md={2}>
                    <img src={screwB} style={{}} />
                </Col>
            </Row>
            <Row className = "d-none d-lg-flex">
                <Col xs={12}>
                    <svg width = "100%" viewBox="0 0 50 6.4" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="3.2" r="3.2" style={ledStyle} />
                    </svg>
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <p className="mb-0 mt-1" style={{fontFamily: "monospace"}}>{motdLine1 || <span className = "d-none d-sm-inline">&nbsp;</span>}</p>
                    <p className="mb-1 mt-0" style={{fontFamily: "monospace"}}>{motdLine2 || <span className = "d-none d-sm-inline">&nbsp;</span>}</p>
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <svg width = "90" viewBox="0 0 20.2 20.2" xmlns="http://www.w3.org/2000/svg" style={{cursor: "not-allowed"}} className="d-none d-sm-inline">
                        <circle cx="10.1" cy="10.1" r="10.1" fill="#424242" />
                        {timeRemaining < 1 ? <circle cx="10.1" cy="10.1" r="7" fill="none" stroke="#FCEF91" stroke-dasharray={timerCircleOn + " " + timerCircleOff} stroke-dashoffset={timerCircleOffset} stroke-linecap="round"/> : null }
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
            <Row className = "acs-bottom" style={{paddingBottom: "0.25em"}}>
                <Col className="d-none d-lg-block acs-screw" md={2}>
                    <img src={screwB} style={{}} />
                </Col>
                <Col xs={12} lg={8}>
                    {power > 0.01 ? power + "W" : null }&nbsp;{freq > 0.01 ? freq.toFixed(2) + "Hz" : null}
                </Col>
                <Col className="d-none d-lg-block acs-screw" md={2}>
                    <img src={screwB} style={{}} />
                </Col>
            </Row>
        </Col>
    </Container></Col>
}
