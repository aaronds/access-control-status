import {ChatSquareText, Plug, Braces} from 'react-bootstrap-icons';

export default function StatusPanelBottom(props) {
    let {menuMode, setMenuMode, power, freq} = props;

    switch (menuMode) {
        case "power":
            return <span onClick={() => {setMenuMode('default')}}>{power > 0.01 ? power + "W" : null }&nbsp;{freq > 0.01 ? freq.toFixed(2) + "Hz" : "No Power"}</span>;
        default:
            return <>
                <div className = "d-none d-lg-block">
                    <a href="" title="Message of the day" onClick={(e) => {e.preventDefault(); setMenuMode('editMotd')}}><ChatSquareText /></a>
                    <a href="" title="Power" onClick={(e) =>{e.preventDefault(); setMenuMode('power')}}><Plug  /></a>
                    <a href="" title="JSON View" onClick={(e) => {e.preventDefault(); setMenuMode('json')}}><Braces /></a>
                </div>
                <div className = "d-block d-lg-none hidden-simple">
                    <a href="" className = "btn btn-secondary" title="Message of the day" onClick={(e) => {e.preventDefault(); setMenuMode('editMotd')}}><ChatSquareText /></a>
                    &nbsp;
                    <a href="" className = "btn btn-secondary" title="Power" onClick={(e) =>{e.preventDefault(); setMenuMode('power')}}><Plug  /></a>
                    &nbsp;
                    <a href="" className = "btn btn-secondary" title="JSON View" onClick={(e) => {e.preventDefault(); setMenuMode('json')}}><Braces /></a>
                </div>

            </>;
    }
}
