import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const tg = window.Telegram.WebApp

function applyTheme() {
  const root = document.documentElement
  
  document.body.style.backgroundColor = '#1a1a1a'
  document.body.style.color = '#ffffff'
  
  root.style.setProperty('--primary-color', '#7289da')
  root.style.setProperty('--secondary-color', '#2f3136')
  root.style.setProperty('--accent-color', '#ffffff')
  root.style.setProperty('--text-primary', '#ffffff')
  root.style.setProperty('--text-secondary', '#b9bbbe')
  root.style.setProperty('--border-color', '#40444b')
  root.style.setProperty('--input-bg', '#2f3136')
  root.style.setProperty('--hover-bg', '#32353b')
}

applyTheme()

tg.onEvent('themeChanged', applyTheme)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
