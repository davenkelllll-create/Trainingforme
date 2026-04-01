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
import { BodyTracker } from './pages/BodyTracker'
import { Profile } from './pages/Profile'
import { ManualEntry } from './pages/ManualEntry'
import { seedDemoData } from './db/database'

export default function App() {
  useEffect(() => {
    seedDemoData()
  }, [])

  return (
    <BrowserRouter basename="/Trainingforme">
      <Routes>
        <Route path="/workout/new" element={<Layout hideNav><NewWorkout /></Layout>} />
        <Route path="/workout/manual" element={<Layout hideNav><ManualEntry /></Layout>} />
        <Route path="/workout/:id/feedback" element={<Layout hideNav><WorkoutFeedback /></Layout>} />
        <Route path="/workout/:id" element={<Layout><WorkoutDetail /></Layout>} />
        <Route path="/history" element={<Layout><History /></Layout>} />
        <Route path="/progress" element={<Layout><Progress /></Layout>} />
        <Route path="/body" element={<Layout><BodyTracker /></Layout>} />
        <Route path="/goals" element={<Layout><Goals /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
