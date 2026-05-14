import { useEffect } from 'react'
import { API_BASE_URL } from '../config'

function Signup() {
  useEffect(() => {
    function registerUser(formId, nameId, emailId, passwordId, confirmPasswordId, role) {
      const form = document.getElementById(formId)
      const msg = document.getElementById('msg')
      const backendUrl = `${API_BASE_URL}/api/register`
      const handler = async (e) => {
        e.preventDefault()
        form.classList.add('was-validated')
        const name = document.getElementById(nameId).value.trim()
        const email = document.getElementById(emailId).value.trim()
        const password = document.getElementById(passwordId).value
        const confirmPassword = document.getElementById(confirmPasswordId).value
        if (!form.checkValidity()) return
        if (password !== confirmPassword) {
          msg.textContent = '❌ Passwords do not match'
          msg.className = 'mt-3 text-center small text-danger'
          return
        }
        msg.textContent = 'Processing...'
        msg.className = 'mt-3 text-center small text-primary'
        try {
          const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
          })
          const data = await response.json()
          if (response.ok) {
            const userData = { name, email, role }
            localStorage.setItem('currentUser', JSON.stringify(userData))
            msg.textContent = '✅ Account created successfully! Redirecting...'
            msg.className = 'mt-3 text-center small text-success'
            setTimeout(() => {
              if (role === 'mentor') {
                window.location.href = '/mentor-dashboard'
              } else {
                window.location.href = '/mentee-dashboard'
              }
            }, 1500)
          } else {
            msg.textContent = `⚠️ ${data.message}`
            msg.className = 'mt-3 text-center small text-danger'
          }
        } catch (error) {
          console.error('Fetch error:', error)
          msg.textContent = '❌ Failed to connect to the server. Check if Node.js server is running on port 3000.'
          msg.className = 'mt-3 text-center small text-danger'
        }
      }
      form?.addEventListener('submit', handler)
      return () => form?.removeEventListener('submit', handler)
    }

    const cleanup1 = registerUser('menteeRegisterForm', 'menteeName', 'menteeEmail', 'menteePassword', 'menteeConfirmPassword', 'mentee')
    const cleanup2 = registerUser('mentorRegisterForm', 'mentorName', 'mentorEmail', 'mentorPassword', 'mentorConfirmPassword', 'mentor')
    return () => {
      cleanup1 && cleanup1()
      cleanup2 && cleanup2()
    }
  }, [])

  return (
    <>
      <nav className="navbar py-2" style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container d-flex align-items-center">
          <button className="btn btn-link p-0 me-3" onClick={() => (window.location.href = '/') } aria-label="Back">
            <i className="bi bi-arrow-left fs-5"></i>
          </button>
          <a className="navbar-brand fw-semibold" href="#">MentorConnect</a>
          <div className="ms-auto">
            <a href="/login" className="btn btn-outline-primary btn-sm">Login</a>
          </div>
        </div>
      </nav>

      <section className="flex-grow-1 d-flex align-items-center justify-content-center py-5" style={{ backgroundColor: '#f0f4f8' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-7 col-lg-6">
              <div className="card p-4 rounded-4" style={{ border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h4 className="text-center fw-bold mb-4">Create Your Account</h4>
                <ul className="nav nav-tabs justify-content-center mb-4" id="registerTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="mentee-tab" data-bs-toggle="tab" data-bs-target="#mentee" type="button" role="tab">Mentee</button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button className="nav-link" id="mentor-tab" data-bs-toggle="tab" data-bs-target="#mentor" type="button" role="tab">Mentor</button>
                  </li>
                </ul>
                <div className="tab-content" id="registerTabsContent">
                  <div className="tab-pane fade show active" id="mentee" role="tabpanel">
                    <form id="menteeRegisterForm" noValidate className="needs-validation">
                      <div className="mb-3">
                        <label htmlFor="menteeName" className="form-label">Full Name</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-person-fill text-primary"></i></span>
                          <input type="text" className="form-control" id="menteeName" required />
                          <div className="invalid-feedback">Full name is required</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="menteeEmail" className="form-label">Email address</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-envelope-fill text-primary"></i></span>
                          <input type="email" className="form-control" id="menteeEmail" required />
                          <div className="invalid-feedback">Please enter a valid email</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="menteePassword" className="form-label">Password</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-lock-fill text-primary"></i></span>
                          <input type="password" className="form-control" id="menteePassword" minLength={6} required />
                          <div className="invalid-feedback">Password must be at least 6 characters</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="menteeConfirmPassword" className="form-label">Confirm Password</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-shield-lock-fill text-primary"></i></span>
                          <input type="password" className="form-control" id="menteeConfirmPassword" minLength={6} required />
                          <div className="invalid-feedback">Passwords do not match</div>
                        </div>
                      </div>
                      <div className="d-grid">
                        <button type="submit" className="btn btn-primary btn-lg rounded-3" style={{ backgroundColor: '#0ea5e9', border: 'none' }}>Register as Mentee</button>
                      </div>
                    </form>
                  </div>
                  <div className="tab-pane fade" id="mentor" role="tabpanel">
                    <form id="mentorRegisterForm" noValidate className="needs-validation">
                      <div className="mb-3">
                        <label htmlFor="mentorName" className="form-label">Full Name</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-person-fill text-primary"></i></span>
                          <input type="text" className="form-control" id="mentorName" required />
                          <div className="invalid-feedback">Full name is required</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="mentorEmail" className="form-label">Email address</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-envelope-fill text-primary"></i></span>
                          <input type="email" className="form-control" id="mentorEmail" required />
                          <div className="invalid-feedback">Please enter a valid email</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="mentorPassword" className="form-label">Password</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-lock-fill text-primary"></i></span>
                          <input type="password" className="form-control" id="mentorPassword" minLength={6} required />
                          <div className="invalid-feedback">Password must be at least 6 characters</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="mentorConfirmPassword" className="form-label">Confirm Password</label>
                        <div className="input-group">
                          <span className="input-group-text"><i className="bi bi-shield-lock-fill text-primary"></i></span>
                          <input type="password" className="form-control" id="mentorConfirmPassword" minLength={6} required />
                          <div className="invalid-feedback">Passwords do not match</div>
                        </div>
                      </div>
                      <div className="d-grid">
                        <button type="submit" className="btn btn-primary btn-lg rounded-3" style={{ backgroundColor: '#0ea5e9', border: 'none' }}>Register as Mentor</button>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="small mb-0">Already have an account? <a href="/login" className="fw-semibold text-primary">Login</a></p>
                </div>
                <div id="msg" className="mt-3 text-center small"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Signup
