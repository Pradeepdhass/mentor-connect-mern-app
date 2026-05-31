import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

function ForgotPassword() {
  const navigate = useNavigate()
  useEffect(() => {
    const form = document.getElementById('forgotPwdForm')
    const msg = document.getElementById('forgotPageMsg')

    const onSubmit = async (e) => {
      e.preventDefault()
      form.classList.add('was-validated')
      const email = document.getElementById('fpEmail')?.value.trim()

      if (!email) {
        msg.textContent = 'Email is required.'
        msg.className = 'mt-3 text-center small text-danger'
        return
      }

      msg.textContent = '⌛ Sending password reset email...'
      msg.className = 'mt-3 text-center small text-primary'
      try {
        await sendPasswordResetEmail(auth, email);
        msg.textContent = '✅ Password reset email sent. Check your inbox.'
        msg.className = 'mt-3 text-center small text-success'
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } catch (err) {
        console.error('Forgot password error:', err)
        msg.textContent = `❌ ${err.message}`
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


