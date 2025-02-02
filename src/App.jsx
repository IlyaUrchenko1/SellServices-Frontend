import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import Create from './components/Create/Create'
import Search from './components/Search/Search'
import Update from './components/Update/Update'
import Default from './components/Default/Default'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    const isWebApp = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone || 
                     document.referrer.includes('android-app://');
                     
    if (!isWebApp) {
      document.body.innerHTML = '<h1>Это приложение доступно только как веб-приложение</h1>';
      throw new Error('Приложение должно быть установлено как веб-приложение');
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Default />} />
        <Route path="/create" element={<Create />} />
        <Route path="/update" element={<Update />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </Router>
  )
}

export default App
