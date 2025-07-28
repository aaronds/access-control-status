import {ChatSquareText, Plug, Braces} from 'react-bootstrap-icons';

export default function StatusPanelBottom(props) {
    let {menuMode, setMenuMode, power, freq} = props;

    switch (menuMode) {
        case "power":
            return <span onClick={() => {setMenuMode('default')}}>{power > 0.01 ? power + "W" : null }&nbsp;{freq > 0.01 ? freq.toFixed(2) + "Hz" : "No Power"}</span>;
        default:
            return <>
                <div class = "d-none d-lg-block">
                    <a href="#" title="Message of the day" onClick={() => {setMenuMode('editMotd')}}><ChatSquareText /></a>
                    <a href="#" title="Power" onClick={() =>{setMenuMode('power')}}><Plug  /></a>
                    <a href="#" title="JSON View" onClick={() => {setMenuMode('json')}}><Braces /></a>
                </div>
                <div class = "d-block d-lg-none">
                    <a href="#" className = "btn btn-secondary" title="Message of the day" onClick={() => {setMenuMode('editMotd')}}><ChatSquareText /></a>
                    &nbsp;
                    <a href="#" className = "btn btn-secondary" title="Power" onClick={() =>{setMenuMode('power')}}><Plug  /></a>
                    &nbsp;
                    <a href="#" className = "btn btn-secondary" title="JSON View" onClick={() => {setMenuMode('json')}}><Braces /></a>
                </div>

            </>;
    }
}
