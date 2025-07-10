import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';

export default function StatusPanelJson(props) {
    let {device, modeMessage, powerMessage, setMenuMode} = props;

    return <Col sm={12}>
        <Row>
            <Col>
                <h4>Device</h4>
                <pre>{JSON.stringify(device, null, "  ")}</pre>
            </Col>
        </Row>
        <Row>
            <Col>
                <h4>Mode</h4>
                <pre>{JSON.stringify(modeMessage, null, "  ")}</pre>
            </Col>
        </Row>
        <Row>
            <Col>
                <h4>Power</h4>
                <pre>{JSON.stringify(powerMessage, null, "  ")}</pre>
            </Col>
        </Row>
        <Row>
            <Col>
                <Button onClick={() =>{setMenuMode('default')}}>Close</Button>
            </Col>
        </Row>
    </Col>;
}
