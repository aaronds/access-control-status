/* Status Pannel Message Of The Day*/
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import {Keyboard} from 'react-bootstrap-icons';

const BHS_FORUM = "https://bristolhackspace.discourse.group/t/";

export default function StatusPanelMotd(props) {
    let {motdLine1, motdLine2, motdLink, menuMode, setMenuMode, updateMotd, submitMotd, cancelMotd} = props;

    function onChangeLine1(e) {
        updateMotd({"motdLine1" : e.target.value }); 
    }

    function onChangeLine2(e) {
        updateMotd({"motdLine2" : e.target.value }); 
    }

    function onChangeLink(e) {
        updateMotd({"motdLink" : e.target.value }); 
    }

    function onSubmit(e) {
        e.preventDefault();
        submitMotd();
        setMenuMode('default');
    }

    function onCancel() {
        cancelMotd();
        setMenuMode('default');
    }

    function isValid() {
        if (motdLink) {
            if (motdLink.length < BHS_FORUM.length) {
                return false;
            }

            if (motdLink.substring(0, BHS_FORUM.length) != BHS_FORUM) {
                return false;
            }
        }

        return true;
    }


    switch (menuMode) {
        case "editMotd":
            return <Form onSubmit={onSubmit}>
                    <Form.Label>Status Message</Form.Label>
                    <Form.Group>
                        <Form.Control onChange={onChangeLine1} type = "text" value={motdLine1} maxLength="16"/>
                    </Form.Group>
                    <Form.Group>
                        <Form.Control onChange={onChangeLine2} type = "text" value={motdLine2} maxLength="16"/>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Forum Link</Form.Label>
                        <Form.Control onChange={onChangeLink} type = "text" placeholder="https://bristolhackspace.discourse.group/..." value={motdLink} />
                    </Form.Group>
                    <Button disabled={!isValid()} onClick={onCancel} variant="secondary" type="button">Cancel</Button>
                    <Button variant="primary" type="submit">Update</Button>
                </Form>
            break;
        default:
            return <>
                <p className="mb-0 mt-1" style={{fontFamily: "monospace"}}>{motdLine1 || <span className = "d-none d-sm-inline">&nbsp;</span>}</p>
                <p className="mb-1 mt-0" style={{fontFamily: "monospace"}}>{motdLine2 || <span className = "d-none d-sm-inline">{motdLink ? null : <>&nbsp;</>}</span>}{motdLink && isValid() ? <a target = "_top" href={motdLink}><Keyboard /></a> : null}</p>
            </>;
    }
}
