import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import Create from './components/Create/Create'
import Search from './components/Search/Search'
import Update from './components/Update/Update'

function App() {
  return (
    <Router>
      <nav>
        <ul>
          <li><Link to="/">Создание</Link></li>
          <li><Link to="/update">Обновление</Link></li>
          <li><Link to="/search">Поиск</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<Create />} />
        <Route path="/update" element={<Update />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </Router>
  )
}

export default App
