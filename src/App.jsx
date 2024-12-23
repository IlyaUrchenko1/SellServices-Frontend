import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import './App.css'
import Create from './components/Create/Create'
import Update from './components/Update/Update'


function App() {
  return (
    <Router>
      <nav>
        <ul>
          <li><Link to="/">Создание</Link></li>
          <li><Link to="/update">Обновление</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<Create inputs={[
          {
            type: "city",
            placeholder: "Введите город"
          },
          {
            type: "ragion",
            placeholder: "Введите район"
          },
          {
            type: "street",
            placeholder: "Введите улицу"
          },
          {
            type: "house",
            placeholder: "Введите номер дома"
          },
          {
            type: "price",
            placeholder: "Введите цену"
          }
        ]} />} />
        <Route path="/update" element={<Update />} />
      </Routes>
    </Router>
  )
}

export default App
