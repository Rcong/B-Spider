import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './lib/node-api'

const div = document.getElementById('root') as HTMLElement
const root = ReactDOM.createRoot(div)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

postMessage({ payload: 'removeLoading' }, '*')
