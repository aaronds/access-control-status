import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

export default function (el) {
    createRoot(el).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
}
