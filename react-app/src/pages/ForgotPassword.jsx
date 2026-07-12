import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

function ForgotPassword() {
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!email) {
      setErrorMsg('Email address is required.')
      return
    }

    setLoading(true)
    setSuccessMsg('⌛ Sending password reset email...')
    
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSuccessMsg('✅ Password reset email sent! Check your inbox for instructions.')
      setErrorMsg('')
      setTimeout(() => {
        navigate('/login')
      }, 3500)
    } catch (err) {
      console.error('Password reset error:', err)
      setErrorMsg(`❌ ${err.message}`)
      setSuccessMsg('')
      setLoading(false)
    }
  }

  return (
    <>
      <nav className="navbar py-3" style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container d-flex align-items-center">
          <Link className="btn btn-link p-0 me-3 text-dark text-decoration-none" to="/login" aria-label="Back">
            <i className="bi bi-arrow-left fs-4"></i>
          </Link>
          <Link className="navbar-brand fw-semibold text-dark text-decoration-none d-flex align-items-center" to="/">
            <img src="/images/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} className="me-2 rounded-circle" />
            <span>MentorConnect</span>
          </Link>
        </div>
      </nav>

      <section className="flex-grow-1 d-flex align-items-center justify-content-center py-5" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5 col-xl-4">
              <div className="card border-0 rounded-4 p-4 p-md-5 shadow-lg bg-white">
                
                <div className="text-center mb-4">
                  <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 60, height: 60 }}>
                    <i className="bi bi-key-fill fs-2"></i>
                  </div>
                  <h4 className="fw-bold mt-2 text-dark">Reset Password</h4>
                  <p className="small text-muted mb-0">Enter your registered email and we'll send you reset instructions.</p>
                </div>

                {errorMsg && <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">{errorMsg}</div>}
                {successMsg && <div className="alert alert-info py-2 px-3 small rounded-3 mb-3">{successMsg}</div>}

                <form onSubmit={handleResetSubmit}>
                  <div className="mb-4">
                    <label htmlFor="fpEmail" className="form-label">Email address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-transparent"><i className="bi bi-envelope text-muted"></i></span>
                      <input 
                        type="email" 
                        className="form-control ps-2" 
                        id="fpEmail" 
                        placeholder="name@example.com" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="d-grid mt-3">
                    <button type="submit" className="btn btn-accent btn-lg py-2.5 rounded-3 text-white fs-6" disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-envelope-paper-fill me-2"></i>}
                      Send Recovery Link
                    </button>
                  </div>
                </form>

                <div className="text-center mt-4 pt-3 border-top">
                  <Link to="/login" className="small fw-semibold text-primary text-decoration-none">Back to Login</Link>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default ForgotPassword
