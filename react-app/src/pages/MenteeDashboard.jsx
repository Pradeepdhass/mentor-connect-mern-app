import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { db } from '../firebase'
import { collection, addDoc } from 'firebase/firestore'

function MenteeDashboard() {
  const { userData, loading, logout } = useAuth();
  useEffect(() => {
    if (loading) return;

    
    
    const mainDisplayName = document.getElementById('mainDisplayName')
    const sidebarDisplayName = document.getElementById('sidebarDisplayName')
    const sidebarDisplayRole = document.getElementById('sidebarDisplayRole')
    const offcanvasDisplayName = document.getElementById('offcanvasDisplayName')
    const logoutBtnSidebar = document.getElementById('logoutBtnSidebar')
    const logoutBtnOffcanvas = document.getElementById('logoutBtnOffcanvas')

    if (!userData || userData.role !== 'mentee') {
      alert('Access Denied. Redirecting to Login.')
      window.location.hash = '#/login'
      return
    }

    const roleText = userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
    const welcomeMessage = userData.name
    if (mainDisplayName) mainDisplayName.textContent = welcomeMessage
    if (sidebarDisplayName) sidebarDisplayName.textContent = welcomeMessage
    if (sidebarDisplayRole) sidebarDisplayRole.textContent = roleText
    if (offcanvasDisplayName) offcanvasDisplayName.textContent = welcomeMessage

    const handleLogout = () => {
      logout()
    }
    if (logoutBtnSidebar) logoutBtnSidebar.addEventListener('click', handleLogout)
    if (logoutBtnOffcanvas) logoutBtnOffcanvas.addEventListener('click', handleLogout)

    // Feedback submit handler
    const feedbackForm = document.getElementById('feedbackForm')
    const feedbackMsg = document.getElementById('feedbackMsg')
    const onFeedbackSubmit = async (e) => {
      e.preventDefault()
      if (!feedbackForm) return
      const mentorEmailInput = document.getElementById('mentorEmail')
      const feedbackText = document.getElementById('feedbackText')
      const feedbackRating = document.getElementById('feedbackRating')
      const mentorEmail = mentorEmailInput?.value.trim()
      const message = feedbackText?.value.trim()
      const rating = Number(feedbackRating?.value || 0)
      if (!mentorEmail || !message) {
        if (feedbackMsg) {
          feedbackMsg.textContent = 'Please enter mentor email and feedback.'
          feedbackMsg.className = 'small text-danger mt-2'
        }
        return
      }
      if (feedbackMsg) {
        feedbackMsg.textContent = 'Submitting...'
        feedbackMsg.className = 'small text-primary mt-2'
      }
      try {
        // Feedback data storage removed per user request, simulating success
        if (feedbackMsg) {
          feedbackMsg.textContent = '✅ Feedback submitted.'
          feedbackMsg.className = 'small text-success mt-2'
        }
        feedbackForm.reset()
      } catch (err) {
        console.error("Feedback error:", err);
        if (feedbackMsg) {
          feedbackMsg.textContent = '❌ Failed to submit feedback.'
          feedbackMsg.className = 'small text-danger mt-2'
        }
      }
    }
    feedbackForm?.addEventListener('submit', onFeedbackSubmit)

    return () => {
      if (logoutBtnSidebar) logoutBtnSidebar.removeEventListener('click', handleLogout)
      if (logoutBtnOffcanvas) logoutBtnOffcanvas.removeEventListener('click', handleLogout)
      feedbackForm?.removeEventListener('submit', onFeedbackSubmit)
    }
  }, [userData, loading, logout])

  return (
    <div className="container-fluid">
      <div className="row">
        <nav className="col-md-4 col-lg-3 sidebar d-none d-md-block" style={{backgroundColor:'#fff', borderRight:'1px solid #dee2e6', height:'100vh', padding:'1.5rem', overflowY:'auto'}}>
          <div className="text-center mb-4">
            <i className="bi bi-person-circle display-4 text-primary mb-2"></i>
            <h6 className="fw-bold mb-0" id="sidebarDisplayName">Loading...</h6>
            <small className="text-muted" id="sidebarDisplayRole">Mentee</small>
          </div>
          <ul className="nav flex-column">
            <li className="nav-item"><a className="nav-link active" href="#"><i className="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
            <li className="nav-item"><a className="nav-link" href="#/my-mentor"><i className="bi bi-person-check-fill me-2"></i>My Mentors</a></li>
            <li className="nav-item"><a className="nav-link" href="#/sessions"><i className="bi bi-calendar2-week me-2"></i>Sessions</a></li>
            <li className="nav-item"><a className="nav-link" href="#/progress"><i className="bi bi-bar-chart-fill me-2"></i>Progress</a></li>
            <li className="nav-item mt-3"><a className="nav-link" href="#/profile"><i className="bi bi-person-lines-fill me-2"></i>Profile</a></li>
            <li className="nav-item"><a className="nav-link text-danger fw-semibold" href="#" id="logoutBtnSidebar"><i className="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </nav>

        <div className="d-md-none p-3">
          <button className="btn btn-outline-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar" aria-controls="mobileSidebar">
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
              <i className="bi bi-person-circle display-4 text-primary mb-2"></i>
              <h6 className="fw-bold mb-0" id="offcanvasDisplayName">Loading...</h6>
              <small className="text-muted">Mentee</small>
            </div>
            <ul className="nav flex-column">
              <li className="nav-item"><a className="nav-link active" href="#"><i className="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
              <li className="nav-item"><a className="nav-link" href="#/my-mentor"><i className="bi bi-person-check-fill me-2"></i>My Mentors</a></li>
              <li className="nav-item"><a className="nav-link" href="#/sessions"><i className="bi bi-calendar2-week me-2"></i>Sessions</a></li>
              <li className="nav-item"><a className="nav-link" href="#/progress"><i className="bi bi-bar-chart-fill me-2"></i>Progress</a></li>
              <li className="nav-item mt-3"><a className="nav-link" href="#/profile"><i className="bi bi-person-lines-fill me-2"></i>Profile</a></li>
              <li className="nav-item"><a className="nav-link text-danger fw-semibold" href="#" id="logoutBtnOffcanvas"><i className="bi bi-box-arrow-right me-2"></i>Logout</a></li>
            </ul>
          </div>
        </div>

        <main className="col-md-8 col-lg-9 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>Welcome, <span className="text-primary" id="mainDisplayName"></span></h4>
            <div>
              <i className="bi bi-bell fs-5 me-3 text-primary"></i>
              <i className="bi bi-person-circle fs-5 text-primary"></i>
            </div>
          </div>

          <div className="card-box">
            <h5>Active Mentorships</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <small className="text-primary">Mentor Assigned</small>
                  <p className="fw-semibold">Ritika Anand - Design Coach</p>
                  <button className="btn btn-outline-primary btn-sm">View</button>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <small className="text-primary">Upcoming Session</small>
                  <p className="fw-semibold">UI/UX Review - 5th July</p>
                  <button className="btn btn-outline-primary btn-sm">Details</button>
                </div>
              </div>
              <div className="col-md-4">
                <div className="border rounded p-3">
                  <small className="text-primary">Overall Progress</small>
                  <p className="fw-semibold">75% Completed</p>
                  <button className="btn btn-outline-primary btn-sm">View</button>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="card-box">
                <h6>Recommended Materials</h6>
                <div className="d-flex gap-3">
                  <a href="#/books" className="recommend-item bg-book">Books</a>
                  <a href="#/videos" className="recommend-item bg-video">Videos</a>
                  <a href="#/courses" className="recommend-item bg-course">Courses</a>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-box">
                <h6>Recent Conversations</h6>
              <div className="d-flex align-items-start mb-3">
                <i className="bi bi-person-circle fs-4 me-2 text-primary"></i>
                <div>
                  <strong>Mentor Ritika</strong>
                  <p className="text-muted mb-0">Reviewed last assignment<br/><small>Yesterday</small></p>
                </div>
              </div>
              <div className="d-flex align-items-start mb-3">
                <i className="bi bi-person-circle fs-4 me-2 text-primary"></i>
                <div>
                  <strong>Mentor Pradeep</strong>
                  <p className="text-muted mb-0">Shared resources on React state<br/><small>2 days ago</small></p>
                </div>
              </div>
              <div className="d-flex align-items-start">
                <i className="bi bi-people fs-4 me-2 text-primary"></i>
                <div>
                  <strong>Peer Group</strong>
                  <p className="text-muted mb-0">Group session discussion<br/><small>Today</small></p>
                </div>
              </div>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-6">
              <div className="card-box">
                <h6>Goals Tracker</h6>
                <ul className="list-group">
                  <li className="list-group-item d-flex justify-content-between">Complete UI Case Study <span className="badge bg-success">Done</span></li>
                  <li className="list-group-item d-flex justify-content-between">Attend Figma Workshop <span className="badge bg-warning text-dark">Pending</span></li>
                  <li className="list-group-item d-flex justify-content-between">Submit Final Portfolio <span className="badge bg-secondary">Upcoming</span></li>
                </ul>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card-box">
                <h6>Quick Links</h6>
                <div className="d-flex flex-wrap gap-2">
                  <a href="#/schedule" className="btn btn-outline-dark btn-sm">Session Schedule</a>
                  <a href="#/resources" className="btn btn-outline-dark btn-sm">Resources</a>
                  <a href="#/profile-settings" className="btn btn-outline-dark btn-sm">Settings</a>
                  <a href="#/support" className="btn btn-outline-dark btn-sm">Help</a>
                </div>
              </div>
            </div>
          </div>

          <div className="card-box mt-4">
            <h6>Share Your Feedback</h6>
            <form id="feedbackForm">
              <div className="row g-2">
                <div className="col-md-6">
                  <input type="email" className="form-control" id="mentorEmail" placeholder="Mentor email (required)" required />
                </div>
                <div className="col-md-3">
                  <select id="feedbackRating" className="form-select">
                    <option value="">Rating (optional)</option>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Bad</option>
                  </select>
                </div>
              </div>
              <textarea id="feedbackText" className="form-control my-2" rows="3" placeholder="What went well or what could be improved..." required></textarea>
              <button type="submit" className="btn btn-primary btn-sm">Submit</button>
              <div id="feedbackMsg" className="small mt-2"></div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MenteeDashboard


