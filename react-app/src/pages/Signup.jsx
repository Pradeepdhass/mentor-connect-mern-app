import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

function Signup() {
  const navigate = useNavigate()
  
  // Registration States
  const [role, setRole] = useState('mentee') // mentee, mentor
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Feedback Messages
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('❌ All registration fields are required.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('❌ Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('❌ Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setSuccessMsg('Registering details...')

    try {
      const emailLower = email.toLowerCase().trim()
      // Admin auto-assignment if email has 'admin'
      let finalRole = role
      let finalStatus = 'approved' // default status
      
      if (emailLower.includes('admin')) {
        finalRole = 'admin'
      } else if (role === 'mentor') {
        finalStatus = 'pending' // Mentors require approval by default
      }

      const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password)
      const user = userCredential.user

      const userData = {
        name: name.trim(),
        email: emailLower,
        role: finalRole,
        status: finalStatus,
        createdAt: new Date().toISOString(),
        bio: '',
        skills: ''
      }

      let collectionName = 'mentees'
      if (finalRole === 'admin') {
        collectionName = 'admins'
      } else if (finalRole === 'mentor') {
        collectionName = 'mentors'
      }

      await setDoc(doc(db, collectionName, user.uid), userData)

      setSuccessMsg('✅ Account created successfully! Redirecting...')
      
      setTimeout(() => {
        if (finalRole === 'admin') {
          window.location.hash = '#/admin-dashboard'
        } else if (finalRole === 'mentor') {
          window.location.hash = '#/mentor-dashboard'
        } else {
          window.location.hash = '#/mentee-dashboard'
        }
      }, 1200)

    } catch (error) {
      console.error('Signup error:', error)
      setErrorMsg(`❌ ${error.message}`)
      setSuccessMsg('')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Navbar */}
      <nav className="navbar py-3" style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container d-flex align-items-center">
          <Link className="btn btn-link p-0 me-3 text-dark text-decoration-none" to="/" aria-label="Back">
            <i className="bi bi-arrow-left fs-4"></i>
          </Link>
          <Link className="navbar-brand fw-semibold text-dark text-decoration-none" to="/">MentorConnect</Link>
          <div className="ms-auto">
            <Link to="/login" className="btn btn-outline-primary btn-sm rounded-pill px-3">Login</Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <section className="flex-grow-1 d-flex align-items-center justify-content-center py-5" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6 col-xl-5">
              <div className="card border-0 rounded-4 p-4 p-md-5 shadow-lg bg-white">
                
                <div className="text-center mb-4">
                  <h4 className="fw-bold text-dark">Create Account</h4>
                  <p className="small text-muted mb-0">Join our mentorship connection to start sharing or learning.</p>
                </div>

                {errorMsg && <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">{errorMsg}</div>}
                {successMsg && <div className="alert alert-success py-2 px-3 small rounded-3 mb-3">{successMsg}</div>}

                {/* Tabs to select Role */}
                <ul className="nav nav-pills justify-content-center mb-4 gap-2 bg-light p-1 rounded-3" id="roleTabs">
                  <li className="nav-item flex-fill text-center">
                    <button 
                      className={`nav-link w-100 rounded-2 fw-semibold py-2 ${role === 'mentee' ? 'active bg-primary text-white' : 'text-muted border-0 bg-transparent'}`} 
                      onClick={() => setRole('mentee')}
                      type="button"
                    >
                      <i className="bi bi-mortarboard-fill me-2"></i>Mentee Student
                    </button>
                  </li>
                  <li className="nav-item flex-fill text-center">
                    <button 
                      className={`nav-link w-100 rounded-2 fw-semibold py-2 ${role === 'mentor' ? 'active bg-success text-white' : 'text-muted border-0 bg-transparent'}`} 
                      onClick={() => setRole('mentor')}
                      type="button"
                    >
                      <i className="bi bi-briefcase-fill me-2"></i>Urban Mentor
                    </button>
                  </li>
                </ul>

                <form onSubmit={handleRegisterSubmit}>
                  
                  {/* Full Name */}
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <div className="input-group">
                      <span className="input-group-text bg-transparent"><i className="bi bi-person text-muted"></i></span>
                      <input 
                        type="text" 
                        className="form-control ps-2" 
                        placeholder="e.g. Ritika Sharma" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-transparent"><i className="bi bi-envelope text-muted"></i></span>
                      <input 
                        type="email" 
                        className="form-control ps-2" 
                        placeholder="name@example.com" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-transparent"><i className="bi bi-lock text-muted"></i></span>
                      <input 
                        type="password" 
                        className="form-control ps-2" 
                        placeholder="•••••••• (Min 6 chars)" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label className="form-label">Confirm Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-transparent"><i className="bi bi-shield-lock text-muted"></i></span>
                      <input 
                        type="password" 
                        className="form-control ps-2" 
                        placeholder="••••••••" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="d-grid mb-3">
                    <button type="submit" className="btn btn-accent btn-lg py-2.5 rounded-3 text-white fs-6" disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-person-check me-2"></i>}
                      Register as {role === 'mentor' ? 'Mentor' : 'Mentee'}
                    </button>
                  </div>
                </form>

         

                <div className="text-center mt-4 pt-3 border-top">
                  <p className="small text-muted mb-0">Already registered? <Link to="/login" className="fw-semibold text-primary text-decoration-none">Log in</Link></p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Signup
