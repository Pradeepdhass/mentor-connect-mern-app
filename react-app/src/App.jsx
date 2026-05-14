import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import MenteeDashboard from './pages/MenteeDashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MentorDashboard from './pages/MentorDashboard'
import CalendarPage from './pages/Calendar'
import Messages from './pages/Messages'
import MyMentor from './pages/MyMentor'
import Sessions from './pages/Sessions'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import MyMentees from './pages/MyMentees'
import Reviews from './pages/Reviews'
import ForgotPassword from './pages/ForgotPassword'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/mentee-dashboard" element={<MenteeDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/mentor-dashboard" element={<MentorDashboard />} />
      <Route path="/sessions" element={<Sessions />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/my-mentees" element={<MyMentees />} />
      <Route path="/reviews" element={<Reviews />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/my-mentor" element={<MyMentor />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  )
}

export default App
