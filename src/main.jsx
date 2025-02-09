import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Получаем объект Telegram WebApp
const tg = window.Telegram.WebApp

// Функция для применения темы
function applyTheme(themeParams) {
  document.body.style.backgroundColor = themeParams.bg_color || '#ffffff'
  document.body.style.color = themeParams.text_color || '#000000'
  // Примените другие параметры темы, такие как кнопки, ссылки и т.д.
}

// Применяем тему при загрузке
if (tg.themeParams) {
  applyTheme(tg.themeParams)
}

// Слушаем изменения темы
tg.onEvent('themeChanged', () => {
  applyTheme(tg.themeParams)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
