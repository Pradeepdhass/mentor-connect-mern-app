import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, collection, addDoc } from 'firebase/firestore'

function Login() {
  useEffect(() => {
    const loginForm = document.getElementById('loginForm')
    const msg = document.getElementById('msg')
    const backendUrl = `${API_BASE_URL}/api/login`

    const onSubmit = async (e) => {
      e.preventDefault()
      loginForm.classList.add('was-validated')
      const emailInput = document.getElementById('email')
      const pwdInput = document.getElementById('pwd')
      const email = emailInput.value.trim()
      const password = pwdInput.value
      if (!email || !password) {
        msg.textContent = 'Email and password are required.'
        msg.className = 'mt-3 text-center small text-danger'
        return
      }
      msg.textContent = '⌛ Logging in...'
      msg.className = 'mt-3 text-center small text-primary'
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          msg.textContent = `✅ Welcome ${userData.name}! Redirecting...`
          msg.className = 'mt-3 text-center small text-success'
          localStorage.setItem('currentUser', JSON.stringify(userData))
          
          if (userData.role === 'mentee') {
            try {
              await addDoc(collection(db, "loginEvents"), {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                createdAt: new Date().toISOString()
              });
            } catch (e) {
              console.error('Failed to record login event:', e);
            }
          }

          setTimeout(() => {
            if (userData.role === 'mentor') {
              window.location.href = '/mentor-dashboard'
            } else {
              window.location.href = '/mentee-dashboard'
            }
          }, 1000)
        } else {
          msg.textContent = `❌ User data not found.`
          msg.className = 'mt-3 text-center small text-danger'
        }
      } catch (error) {
        console.error('Firebase error:', error)
        msg.textContent = '❌ Invalid credentials or network error.'
        msg.className = 'mt-3 text-center small text-danger'
      }
    }

    loginForm?.addEventListener('submit', onSubmit)

    return () => {
      loginForm?.removeEventListener('submit', onSubmit)
    }
  }, [])

  return (
    <>
      <nav className="navbar py-2" style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container d-flex align-items-center">
          <button className="btn btn-link p-0 me-3" onClick={() => (window.location.href = '/')} aria-label="Back">
            <i className="bi bi-arrow-left fs-5"></i>
          </button>
          <a className="navbar-brand fw-semibold" href="#">MentorConnect</a>
          <div className="ms-auto">
            <a href="/signup" className="btn btn-outline-primary btn-sm">Sign Up</a>
          </div>
        </div>
      </nav>

      <section className="flex-grow-1 d-flex align-items-center justify-content-center py-5" style={{ background: '#f0f4f8' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card rounded-4 p-4" style={{ border: '1px solid #e0e0e0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                <div className="text-center mb-4">
                  <i className="bi bi-person-circle text-primary fs-1"></i>
                  <h4 className="fw-bold mt-2">Login to MentorConnect</h4>
                </div>
                <form id="loginForm" noValidate>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email address</label>
                    <div className="input-group">
                      <span className="input-group-text border-end-0"><i className="bi bi-envelope text-primary"></i></span>
                      <input type="email" className="form-control border-start-0" id="email" required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="pwd" className="form-label">Password</label>
                    <div className="input-group">
                      <span className="input-group-text border-end-0"><i className="bi bi-lock-fill text-primary"></i></span>
                      <input type="password" className="form-control border-start-0" id="pwd" required />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="remember" />
                      <label className="form-check-label small" htmlFor="remember">Remember me</label>
                    </div>
                    <Link to="/forgot-password" className="small text-decoration-none text-primary">Forgot password?</Link>
                  </div>
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary btn-lg rounded-3" style={{ backgroundColor: '#0ea5e9', border: 'none' }}>Login</button>
                  </div>
                </form>
                <div className="text-center mt-3">
                  <p className="small mb-0">Don't have an account? <a href="/signup" className="fw-semibold text-primary">Sign up</a></p>
                </div>
                <div id="msg" className="mt-3 text-center small text-danger"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}

export default Login
