import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

function ForgotPassword() {
  const navigate = useNavigate()
  useEffect(() => {
    const form = document.getElementById('forgotPwdForm')
    const msg = document.getElementById('forgotPageMsg')

    const onSubmit = async (e) => {
      e.preventDefault()
      form.classList.add('was-validated')
      const email = document.getElementById('fpEmail')?.value.trim()
      const newPassword = document.getElementById('fpNewPwd')?.value
      const confirmPassword = document.getElementById('fpConfirmPwd')?.value

      if (!email || !newPassword || !confirmPassword) {
        msg.textContent = 'All fields are required.'
        msg.className = 'mt-3 text-center small text-danger'
        return
      }
      if (newPassword !== confirmPassword) {
        msg.textContent = 'Passwords do not match.'
        msg.className = 'mt-3 text-center small text-danger'
        return
      }

      msg.textContent = '⌛ Updating password...'
      msg.className = 'mt-3 text-center small text-primary'
      try {
        const resp = await fetch(`${API_BASE_URL}/api/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword })
        })
        const data = await resp.json()
        if (resp.ok) {
          msg.textContent = '✅ Password updated. You can now log in.'
          msg.className = 'mt-3 text-center small text-success'
          setTimeout(() => {
            window.location.href = '/login'
          }, 1200)
        } else {
          msg.textContent = `❌ ${data.message || 'Failed to update password.'}`
          msg.className = 'mt-3 text-center small text-danger'
        }
      } catch (err) {
        console.error('Forgot password error:', err)
        msg.textContent = '❌ Network error. Check if the Node.js server is running.'
        msg.className = 'mt-3 text-center small text-danger'
      }
    }

    form?.addEventListener('submit', onSubmit)
    return () => form?.removeEventListener('submit', onSubmit)
  }, [])

  return (
    <>
      <nav className="navbar py-2" style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container d-flex align-items-center">
          <button className="btn btn-link p-0 me-3" onClick={() => navigate(-1)} aria-label="Back">
            <i className="bi bi-arrow-left fs-5"></i>
          </button>
          <a className="navbar-brand fw-semibold" href="#">MentorConnect</a>
        </div>
      </nav>

      <section className="flex-grow-1 d-flex align-items-center justify-content-center py-5" style={{ background: '#f0f4f8' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card rounded-4 p-4" style={{ border: '1px solid #e0e0e0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                <div className="text-center mb-3">
                  <i className="bi bi-shield-lock text-primary fs-1"></i>
                  <h4 className="fw-bold mt-2">Reset Your Password</h4>
                  <p className="small text-muted mb-0">Enter your account email and a new password.</p>
                </div>
                <form id="forgotPwdForm" noValidate>
                  <div className="mb-3">
                    <label htmlFor="fpEmail" className="form-label">Email address</label>
                    <input type="email" className="form-control" id="fpEmail" required />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="fpNewPwd" className="form-label">New Password</label>
                    <input type="password" className="form-control" id="fpNewPwd" minLength="6" required />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="fpConfirmPwd" className="form-label">Confirm Password</label>
                    <input type="password" className="form-control" id="fpConfirmPwd" minLength="6" required />
                  </div>
                  <div className="d-grid mt-3">
                    <button type="submit" className="btn btn-primary btn-lg rounded-3" style={{ backgroundColor: '#0ea5e9', border: 'none' }}>Update Password</button>
                  </div>
                </form>
                <div id="forgotPageMsg" className="mt-3 text-center small"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default ForgotPassword


