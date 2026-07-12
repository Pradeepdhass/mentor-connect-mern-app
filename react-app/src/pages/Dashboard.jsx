import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

function Dashboard() {
  const { userData, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (userData) {
      if (userData.role === 'admin') {
        window.location.hash = '#/admin-dashboard'
      } else if (userData.role === 'mentor') {
        window.location.hash = '#/mentor-dashboard'
      } else {
        window.location.hash = '#/mentee-dashboard'
      }
    } else {
      window.location.hash = '#/login'
    }
  }, [userData, loading])

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-medium text-secondary">Redirecting to your dashboard portal...</p>
      </div>
    </div>
  )
}

export default Dashboard
