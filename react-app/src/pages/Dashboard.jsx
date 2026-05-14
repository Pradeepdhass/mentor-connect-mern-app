import { useEffect } from 'react'

function Dashboard() {
  useEffect(() => {
    const userDataJson = localStorage.getItem('currentUser')
    const userData = userDataJson ? JSON.parse(userDataJson) : null
    const welcomeMessage = document.getElementById('welcomeMessage')
    const displayName = document.getElementById('displayName')
    const displayEmail = document.getElementById('displayEmail')
    const displayRole = document.getElementById('displayRole')
    const userRoleDisplay = document.getElementById('userRoleDisplay')
    const logoutButton = document.getElementById('logoutButton')

    if (userData) {
      if (displayName) displayName.textContent = userData.name
      if (displayEmail) displayEmail.textContent = userData.email
      if (displayRole) displayRole.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
      if (userRoleDisplay) userRoleDisplay.textContent = `Logged in as: ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}`
      if (welcomeMessage) welcomeMessage.textContent = userData.role === 'mentor' ? 'You are ready to start mentoring!' : 'Start connecting with mentors!'
    } else {
      alert('You must be logged in to view the dashboard.')
      window.location.href = '/login'
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.removeItem('currentUser')
        window.location.href = '/login'
      })
    }
  }, [])

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">MentorConnect</a>
          <span className="ms-auto text-muted" id="userRoleDisplay"></span>
          <button className="btn btn-danger btn-sm ms-3" id="logoutButton">Logout</button>
        </div>
      </nav>

      <div className="container py-5">
        <div className="card p-4 shadow">
          <h1 className="mb-3">Welcome to your Dashboard!</h1>
          <p className="lead">Account Status: <strong id="welcomeMessage"></strong></p>
          <div className="mt-4">
            <h5>Your Details:</h5>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">Name: <strong id="displayName"></strong></li>
              <li className="list-group-item">Email: <strong id="displayEmail"></strong></li>
              <li className="list-group-item">Role: <strong id="displayRole"></strong></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard


