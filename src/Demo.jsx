import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import StatusPanelDisplay from './StatusPanelDisplay'
import './Demo.css'
import './StatusPanel.css'

export default function () {
    return (
        <>
            <Container>
                <Row>
                    <StatusPanelDisplay id = "locked" name = "Ready" led = "breathe" isOn={false} timeRemaining={1} status = "LOCKED" power = {0} freq = {0} />
                    <StatusPanelDisplay id = "unlockedNoPower" name = "On" led = "off" isOn={true} timeRemaining={1} status = "UNLOCKED" power = {0} freq = {0} />
                    <StatusPanelDisplay id = "unlockedInUse" name = "In Use" led = "off" isOn={true} timeRemaining={1} status = "IN USE" power = {400} freq = {50.13} />
                    <StatusPanelDisplay id = "unlockedCountdown" name = "Count Down" led = "off" isOn={true} timeRemaining={0.66} status = "UNLOCKED" power = {0} freq = {50.13} />
                    <StatusPanelDisplay id = "error" name = "Error" led = "off" isOn={false} timeRemaining={1} status = "UNLOCKED" power = {0} freq = {0} errorTag = "MAIN" errorMessage = "POWER OFF" />
                    <StatusPanelDisplay id = "offline" name = "Offline" led = "offline" isOn={false} timeRemaining={1} status = "OFFLINE" power = {0} freq = {0} />
                    <StatusPanelDisplay id = "locked" name = "MESSAGE OF THE DAY" led = "breathe" isOn={false} timeRemaining={1} status = "LOCKED" power = {0} freq = {0} motdLine1="INDUCTION" motdLine2="Tue 19:00"/>
                    <StatusPanelDisplay id = "observer" name = "Observer" led = "breathe" isOn={true} isObserver={true} timeRemaining={1} status = "UNLOCKED" power = {50} freq = {50.13} />
                </Row>
            </Container>
        </>
    );
}

