import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Feed from './components/Feed'
import Themes from './components/Themes'

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/themes" element={<Themes />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App



