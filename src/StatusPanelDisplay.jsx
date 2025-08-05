import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import './StatusPanel.css'
import screwA from './assets/Screw_a.svg';
import screwB from './assets/Screw_b.svg';

import StatusPanelMotd from './StatusPanelMotd';
import StatusPanelStatus from './StatusPanelStatus';
import StatusPanelBottom from './StatusPanelBottom';

export default function StatusPanelDisplay(props) {
    let { id, name, led, isOn, isObserver, timeRemaining, status, power, freq, motdLine1, motdLine2, motdLink, menuMode, setMenuMode, updateMotd, submitMotd, cancelMotd, errorTag, errorMessage } = props;

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
            {!isObserver ? <Row className = "d-none d-lg-flex">
                <Col xs={12}>
                    <svg width = "100%" viewBox="0 0 50 6.4" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="3.2" r="3.2" style={ledStyle} />
                    </svg>
                </Col>
            </Row> : null }
            <Row>
                <Col xs={12}>
                    <StatusPanelMotd motdLine1={motdLine1} motdLine2={motdLine2} motdLink={motdLink} updateMotd={updateMotd} submitMotd={submitMotd} cancelMotd={cancelMotd} menuMode={menuMode} setMenuMode={setMenuMode} />
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <StatusPanelStatus timeRemaining={timeRemaining} status={status} menuMode={menuMode} isObserver={isObserver} errorTag={errorTag} errorMessage={errorMessage}/>
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
                    <StatusPanelBottom menuMode={menuMode} setMenuMode={setMenuMode} power={power} freq={freq} />
                </Col>
                <Col className="d-none d-lg-block acs-screw" md={2}>
                    <img src={screwB} style={{}} />
                </Col>
            </Row>
        </Col>
    </Container></Col>
}
