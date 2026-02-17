import './App.css'

import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'

import Home from './routes/home/Home'
import Notice from './routes/notice/Notice'
import Timetable from './routes/timetable/Timetable'
import BoothMap from "./routes/boothmap/BoothMap";
import LostItem from "./routes/lostitem/LostItem";
import Admin from "./routes/admin/Admin";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/notice" element={<Notice />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/map" element={<BoothMap />} />
        <Route path="/lost-item" element={<LostItem />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}

export default App
