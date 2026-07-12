import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

function Login() {
  const navigate = useNavigate()
  
  // Input states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    const form = e.currentTarget
    form.classList.add('was-validated')
    
    if (!email || !password) {
      setErrorMsg('Email and password are required.')
      return
    }
    
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('⌛ Logging in...')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Fetch profile from admins, mentors, or mentees collections
      let docSnap = await getDoc(doc(db, "admins", user.uid));
      let role = 'admin';
      let name = '';

      if (docSnap.exists()) {
        name = docSnap.data().name;
      } else {
        docSnap = await getDoc(doc(db, "mentors", user.uid));
        role = 'mentor';
        if (docSnap.exists()) {
          name = docSnap.data().name;
        } else {
          docSnap = await getDoc(doc(db, "mentees", user.uid));
          role = 'mentee';
          if (docSnap.exists()) {
            name = docSnap.data().name;
          } else {
            // Fallback general users collection
            docSnap = await getDoc(doc(db, "users", user.uid));
            if (docSnap.exists()) {
              const data = docSnap.data();
              role = data.role;
              name = data.name;
            } else {
              role = '';
            }
          }
        }
      }

      if (role) {
        setSuccessMsg(`✅ Welcome ${name || 'User'}! Redirecting...`)
        
        setTimeout(() => {
          if (role === 'admin') {
            window.location.hash = '#/admin-dashboard'
          } else if (role === 'mentor') {
            window.location.hash = '#/mentor-dashboard'
          } else {
            window.location.hash = '#/mentee-dashboard'
          }
        }, 1000)
      } else {
        setErrorMsg('❌ Profile data not found.')
        setSuccessMsg('')
        setLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrorMsg('❌ Invalid email or password credentials.')
      setSuccessMsg('')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar py-3" style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container d-flex align-items-center">
          <Link className="btn btn-link p-0 me-3 text-dark text-decoration-none" to="/" aria-label="Back">
            <i className="bi bi-arrow-left fs-4"></i>
          </Link>
          <Link className="navbar-brand fw-semibold text-dark text-decoration-none" to="/">MentorConnect</Link>
          <div className="ms-auto">
            <Link to="/signup" className="btn btn-outline-primary btn-sm rounded-pill px-3">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Main Login Card Section */}
      <section className="flex-grow-1 d-flex align-items-center justify-content-center py-5" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)', minHeight: 'calc(100vh - 70px)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5 col-xl-4">
              <div className="card border-0 rounded-4 p-4 p-md-5 shadow-lg bg-white">
                
                <div className="text-center mb-4">
                  <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 60, height: 60 }}>
                    <i className="bi bi-shield-lock-fill fs-2"></i>
                  </div>
                  <h4 className="fw-bold mt-2 text-dark">Portal Login</h4>
                  <p className="small text-muted mb-0">Enter your credentials to access your ERP dashboard.</p>
                </div>

                {errorMsg && <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">{errorMsg}</div>}
                {successMsg && <div className="alert alert-info py-2 px-3 small rounded-3 mb-3">{successMsg}</div>}

                <form onSubmit={handleLoginSubmit} noValidate className="needs-validation">
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email address</label>
                    <div className="input-group">
                      <span className="input-group-text border-end-0 bg-transparent"><i className="bi bi-envelope text-primary"></i></span>
                      <input 
                        type="email" 
                        className="form-control border-start-0 ps-1" 
                        id="email" 
                        placeholder="name@example.com" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required 
                      />
                      <div className="invalid-feedback">Please enter a valid email.</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="pwd" className="form-label">Password</label>
                    <div className="input-group">
                      <span className="input-group-text border-end-0 bg-transparent"><i className="bi bi-lock text-primary"></i></span>
                      <input 
                        type="password" 
                        className="form-control border-start-0 ps-1" 
                        id="pwd" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required 
                      />
                      <div className="invalid-feedback">Please enter your password.</div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="remember" />
                      <label className="form-check-label small text-muted" htmlFor="remember">Remember me</label>
                    </div>
                    <Link to="/forgot-password" className="small text-decoration-none text-primary fw-medium">Forgot password?</Link>
                  </div>

                  <div className="d-grid">
                    <button type="submit" className="btn btn-accent btn-lg py-2.5 rounded-3 text-white fs-6" disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-box-arrow-in-right me-2"></i>}
                      Login
                    </button>
                  </div>
                </form>

                <div className="text-center mt-4 pt-3 border-top">
                  <p className="small text-muted mb-0">Don't have an account? <Link to="/signup" className="fw-semibold text-primary text-decoration-none">Sign up</Link></p>
                </div>

                

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Login
