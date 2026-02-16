import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import SchedulePage from './pages/SchedulePage'
import LogPage from './pages/LogPage'
import StatsPage from './pages/StatsPage'
import ExperimentPage from './pages/ExperimentPage'
import GoalsPage from './pages/GoalsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter basename="/sleep_tracker">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/experiment" element={<ExperimentPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  )
}
