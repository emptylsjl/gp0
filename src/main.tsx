import React from 'react'
import ReactDOM from 'react-dom/client'
import './style0.css'
import { Background } from "./Background.tsx";
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Background/>
    <Analytics/>
  </React.StrictMode>,
)
