import { useEffect } from 'react'

function MentorDashboard() {
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser'))
    const mainDisplayName = document.getElementById('mainDisplayName')
    const sidebarDisplayName = document.getElementById('sidebarDisplayName')
    const sidebarDisplayRole = document.getElementById('sidebarDisplayRole')
    const offcanvasDisplayName = document.getElementById('offcanvasDisplayName')
    const logoutBtnSidebar = document.getElementById('logoutBtnSidebar')
    const logoutBtnOffcanvas = document.getElementById('logoutBtnOffcanvas')

    if (!userData || userData.role !== 'mentor') {
      alert('Access Denied. Redirecting to Login.')
      window.location.href = '/login'
      return
    }

    const roleText = userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
    const welcomeMessage = userData.name
    if (mainDisplayName) mainDisplayName.textContent = welcomeMessage
    if (sidebarDisplayName) sidebarDisplayName.textContent = welcomeMessage
    if (sidebarDisplayRole) sidebarDisplayRole.textContent = roleText
    if (offcanvasDisplayName) offcanvasDisplayName.textContent = welcomeMessage

    const handleLogout = () => {
      localStorage.removeItem('currentUser')
      window.location.href = '/login'
    }
    if (logoutBtnSidebar) logoutBtnSidebar.addEventListener('click', handleLogout)
    if (logoutBtnOffcanvas) logoutBtnOffcanvas.addEventListener('click', handleLogout)

    return () => {
      if (logoutBtnSidebar) logoutBtnSidebar.removeEventListener('click', handleLogout)
      if (logoutBtnOffcanvas) logoutBtnOffcanvas.removeEventListener('click', handleLogout)
    }
  }, [])

  return (
    <div className="container-fluid">
      <div className="row">
        <nav className="col-md-4 col-lg-3 sidebar d-none d-md-block" style={{backgroundColor:'#fff', borderRight:'1px solid #dee2e6', height:'100vh', padding:'1.5rem', overflowY:'auto'}}>
          <div className="text-center mb-4">
            <i className="bi bi-person-circle display-4 text-success mb-2"></i>
            <h6 className="fw-bold mb-0" id="sidebarDisplayName">Loading...</h6>
            <small className="text-muted" id="sidebarDisplayRole">Mentor</small>
          </div>
          <ul className="nav flex-column">
            <li className="nav-item"><a className="nav-link active" href="#"><i className="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
            <li className="nav-item"><a className="nav-link" href="/my-mentees"><i className="bi bi-people-fill me-2"></i>My Mentees</a></li>
            <li className="nav-item"><a className="nav-link" href="/calendar"><i className="bi bi-calendar-check me-2"></i>Schedule</a></li>
            <li className="nav-item"><a className="nav-link" href="/reviews"><i className="bi bi-star-fill me-2"></i>Reviews</a></li>
            <li className="nav-item mt-3"><a className="nav-link" href="/profile"><i className="bi bi-person-lines-fill me-2"></i>Profile</a></li>
            <li className="nav-item"><a className="nav-link text-danger fw-semibold" href="#" id="logoutBtnSidebar"><i className="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </nav>

        <div className="d-md-none p-3">
          <button className="btn btn-outline-success" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar" aria-controls="mobileSidebar">
            <i className="bi bi-list"></i> Menu
          </button>
        </div>

        <div className="offcanvas offcanvas-start" tabIndex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="mobileSidebarLabel">Menu</h5>
            <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body">
            <div className="text-center mb-4">
              <i className="bi bi-person-circle display-4 text-success mb-2"></i>
              <h6 className="fw-bold mb-0" id="offcanvasDisplayName">Loading...</h6>
              <small className="text-muted">Mentor</small>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item"><a className="nav-link active" href="#"><i className="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
              <li className="nav-item"><a className="nav-link" href="/my-mentees"><i className="bi bi-people-fill me-2"></i>My Mentees</a></li>
              <li className="nav-item"><a className="nav-link" href="/calendar"><i className="bi bi-calendar-check me-2"></i>Schedule</a></li>
              <li className="nav-item"><a className="nav-link" href="/reviews"><i className="bi bi-star-fill me-2"></i>Reviews</a></li>
              <li className="nav-item mt-3"><a className="nav-link" href="/profile"><i className="bi bi-person-lines-fill me-2"></i>Profile</a></li>
              <li className="nav-item"><a className="nav-link text-danger fw-semibold" href="#" id="logoutBtnOffcanvas"><i className="bi bi-box-arrow-right me-2"></i>Logout</a></li>
            </ul>
          </div>
        </div>

        <main className="col-md-8 col-lg-9 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>Welcome, <span className="text-success" id="mainDisplayName"></span></h4>
            <div>
              <i className="bi bi-bell fs-5 me-3 text-success"></i>
              <i className="bi bi-person-circle fs-5 text-success"></i>
            </div>
          </div>

          <div className="card-box">
            <h5>Mentorship Summary</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <small className="text-success">Active Mentees</small>
                  <p className="fw-semibold">3 Total</p>
                  <button className="btn btn-outline-success btn-sm">View List</button>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <small className="text-success">New Requests</small>
                  <p className="fw-semibold">1 Pending Approval</p>
                  <button className="btn btn-outline-success btn-sm">Review Now</button>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <small className="text-success">Upcoming Session</small>
                  <p className="fw-semibold">Mentee John - Today 3 PM</p>
                  <button className="btn btn-outline-success btn-sm">Join</button>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="card-box">
                <h6>Quick Actions</h6>
                <div className="d-flex gap-3">
                  <a href="/requests" className="recommend-item" style={{ backgroundColor: '#ffc107' }}>Pending Requests</a>
                  <a href="/calendar" className="recommend-item" style={{ backgroundColor: '#0d6efd' }}>Schedule Session</a>
                  <a href="/material" className="recommend-item" style={{ backgroundColor: '#6c757d' }}>Share Resources</a>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-box">
                <h6>Recent Activity</h6>
                <div className="d-flex align-items-start mb-3">
                  <i className="bi bi-person-circle fs-4 me-2 text-success"></i>
                  <div>
                    <strong>Mentee Pradeep</strong>
                    <p className="text-muted mb-0">Submitted final portfolio<br/><small>3 hours ago</small></p>
                  </div>
                </div>
                <div className="d-flex align-items-start">
                  <i className="bi bi-calendar-check fs-4 me-2 text-success"></i>
                  <div>
                    <strong>System Notification</strong>
                    <p className="text-muted mb-0">Session with Jane confirmed<br/><small>Yesterday</small></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-6">
              <div className="card-box">
                <h6>To-Do List</h6>
                <ul className="list-group">
                  <li className="list-group-item d-flex justify-content-between">Review Jane's resume <span className="badge bg-danger">Urgent</span></li>
                  <li className="list-group-item d-flex justify-content-between">Update calendar availability <span className="badge bg-warning text-dark">Today</span></li>
                  <li className="list-group-item d-flex justify-content-between">Prepare slides for next group session <span className="badge bg-secondary">Upcoming</span></li>
                </ul>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-box">
                <h6>Quick Links</h6>
                <div className="d-flex flex-wrap gap-2">
                  <a href="/mentee-list" className="btn btn-outline-dark btn-sm">Mentees List</a>
                  <a href="/reports" className="btn btn-outline-dark btn-sm">Performance Reports</a>
                  <a href="/profile-settings" className="btn btn-outline-dark btn-sm">Settings</a>
                  <a href="/support" className="btn btn-outline-dark btn-sm">Help</a>
                </div>
              </div>
            </div>
          </div>

          <div className="card-box mt-4">
            <h6>Tips & Resources for Mentors</h6>
            <p className="text-muted mb-0">Check out the new guide on giving constructive feedback effectively.</p>
            <button className="btn btn-link btn-sm p-0">Read More <i className="bi bi-arrow-right"></i></button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MentorDashboard


