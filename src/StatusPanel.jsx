import { useState } from 'react'
import './StatusPanel.css'

export default function StatusPanel(props) {
    let { led, power, state} = props;
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
        default:
            break;
    }
        
    
    return <svg width = "10em" viewBox="0 0 50 150" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="21" r="3.2" style={ledStyle} />
        <circle cx="25" cy="56" fill="black" r="10.1" />
        <circle cx="25" cy="84" fill={power ? "hsl(28 100% 50.6%)" : "hsl(28 100% 20.6%)"} r="5.4" />
        <style>
        </style>
    </svg>
    
}
