import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { NewWorkout } from './pages/NewWorkout'
import { WorkoutDetail } from './pages/WorkoutDetail'
import { WorkoutFeedback } from './pages/WorkoutFeedback'
import { History } from './pages/History'
import { Progress } from './pages/Progress'
import { Goals } from './pages/Goals'
import { Settings } from './pages/Settings'
import { seedDemoData } from './db/database'

export default function App() {
  useEffect(() => {
    seedDemoData()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/workout/new" element={<Layout hideNav><NewWorkout /></Layout>} />
        <Route path="/workout/:id/feedback" element={<Layout hideNav><WorkoutFeedback /></Layout>} />
        <Route path="/workout/:id" element={<Layout><WorkoutDetail /></Layout>} />
        <Route path="/history" element={<Layout><History /></Layout>} />
        <Route path="/progress" element={<Layout><Progress /></Layout>} />
        <Route path="/goals" element={<Layout><Goals /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
