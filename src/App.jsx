import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import Create from './components/Create/Create'
import Search from './components/Search/Search'
import Update from './components/Update/Update'
import Default from './components/Default/Default'

function App() {
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
