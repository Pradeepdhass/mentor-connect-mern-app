import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, addDoc } from 'firebase/firestore'

function Home() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [formStatus, setFormStatus] = useState('')
  const [formErr, setFormErr] = useState('')

  useEffect(() => {
    const body = document.body
    if (theme === 'dark') {
      body.classList.add('dark-mode')
    } else {
      body.classList.remove('dark-mode')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!contactName || !contactEmail || !contactMessage) {
      setFormErr('Please complete all form fields.')
      return
    }
    setFormStatus('⌛ Sending message...')
    setFormErr('')
    
    try {
      await addDoc(collection(db, "contact_messages"), {
        name: contactName,
        email: contactEmail,
        message: contactMessage,
        createdAt: new Date().toISOString()
      })
      setFormStatus('✅ Your message has been sent successfully!')
      setContactName('')
      setContactEmail('')
      setContactMessage('')
    } catch (err) {
      console.error(err)
      setFormErr('❌ Failed to send message. Please try again.')
      setFormStatus('')
    }
  }

  return (
    <>
      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg custom-navbar sticky-top shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
            <img src="/images/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} className="me-2 rounded-circle" />
            <span>MentorConnect</span>
          </Link>
          
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-3">
              <li className="nav-item"><a className="nav-link active" href="#">Home</a></li>
              <li className="nav-item"><Link className="nav-link" to="/signup">Find Mentor</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/signup">Become Mentor</Link></li>
              <li className="nav-item">
                <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  How It Works
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Contact
                </a>
              </li>
              <li className="nav-item d-none d-lg-block">
                <Link to="/login" className="btn btn-outline-light btn-sm rounded-pill px-3">Login</Link>
              </li>
              <li className="nav-item d-none d-lg-block">
                <Link to="/signup" className="btn btn-accent btn-sm rounded-pill px-3 text-white">Get Started</Link>
              </li>
              
              {/* Dark Mode Switcher */}
              <li className="nav-item ps-lg-2">
                <button 
                  className="btn btn-link nav-link p-0 border-0 bg-transparent text-white" 
                  onClick={handleToggleTheme}
                  title="Toggle Theme"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? <i className="bi bi-sun-fill text-warning fs-5"></i> : <i className="bi bi-moon-stars-fill text-info fs-5"></i>}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero position-relative d-flex align-items-center justify-content-center py-5">
        <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80" 
            className="w-100 h-100 object-fit-cover" 
            style={{ filter: 'brightness(25%)' }} 
            alt="Mentorship Connections Background" 
          />
        </div>

        <div className="container position-relative text-white text-center px-4 py-5" style={{ zIndex: 1, maxWidth: 850 }}>
          <span className="badge bg-info-subtle text-info fs-6 px-3 py-2 rounded-pill mb-3 uppercase animate__animated animate__fadeInDown">
            Empowering Rural Minds through Urban Mentorship
          </span>
          <h1 className="display-3 fw-extrabold mb-3 text-shadow animate__animated animate__fadeInUp" style={{ letterSpacing: '-1.5px', lineHeight: 1.15 }}>
            Urban Rural Mentor Mentee Connection
          </h1>
          <p className="lead mb-4 text-light-emphasis fs-4 animate__animated animate__fadeInUp animate__delay-1s" style={{ fontWeight: 400, opacity: 0.9 }}>
            Connecting experienced Urban Industry Professionals with aspirational Rural Students to provide career guidance, personal mentoring, tech skills, and vital industry exposure.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap animate__animated animate__fadeInUp animate__delay-1s">
            <Link to="/signup" className="btn btn-lg btn-accent px-4 py-3 shadow-lg fs-6">
              <i className="bi bi-search me-2"></i>Find Mentor
            </Link>
            <Link to="/signup" className="btn btn-lg btn-outline-light px-4 py-3 fs-6">
              Become Mentor<i className="bi bi-arrow-right ms-2"></i>
            </Link>
            <a href="#features" className="btn btn-lg btn-link text-white text-decoration-none fs-6">
              Explore Platform <i className="bi bi-arrow-down"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Platform Statistics Section */}
      <section className="py-5 bg-white text-center border-bottom">
        <div className="container">
          <div className="row g-4">
            <div className="col-6 col-md-3">
              <div className="p-3">
                <i className="bi bi-people-fill text-primary display-5 mb-2"></i>
                <h3 className="fw-bold mb-1">500+</h3>
                <p className="text-muted small uppercase mb-0">Active Students</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3">
                <i className="bi bi-person-workspace text-success display-5 mb-2"></i>
                <h3 className="fw-bold mb-1">150+</h3>
                <p className="text-muted small uppercase mb-0">Industry Experts</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3">
                <i className="bi bi-camera-video-fill text-warning display-5 mb-2"></i>
                <h3 className="fw-bold mb-1">2,000+</h3>
                <p className="text-muted small uppercase mb-0">Mentorship Hours</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3">
                <i className="bi bi-geo-alt-fill text-danger display-5 mb-2"></i>
                <h3 className="fw-bold mb-1">30+</h3>
                <p className="text-muted small uppercase mb-0">Rural Communities</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-5 bg-light">
        <div className="container">
          <div className="text-center max-width-600 mx-auto mb-5">
            <span className="text-primary fw-semibold small uppercase">Why MentorConnect?</span>
            <h2 className="fw-bold mt-2 text-dark">Platform Offerings & Support</h2>
            <p className="text-muted small">Bridging the geographical divide with real-time digital mentoring resources.</p>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card-box bg-white h-100">
                <div className="widget-icon icon-primary mb-3"><i className="bi bi-chat-left-dots-fill"></i></div>
                <h5 className="fw-bold mb-2 text-dark">Direct Mentorship</h5>
                <p className="text-muted small mb-0">Connect directly with professionals working in Tech, Design, Finance, and Engineering for personalized instruction.</p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card-box bg-white h-100">
                <div className="widget-icon icon-success mb-3"><i className="bi bi-briefcase-fill"></i></div>
                <h5 className="fw-bold mb-2 text-dark">Career Guidance</h5>
                <p className="text-muted small mb-0">Learn resume building, interview etiquette, portfolio development, and standard workflow strategies from insiders.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card-box bg-white h-100">
                <div className="widget-icon icon-warning mb-3"><i className="bi bi-laptop-fill"></i></div>
                <h5 className="fw-bold mb-2 text-dark">Industry Exposure</h5>
                <p className="text-muted small mb-0">Receive insights on product cycles, corporate structures, and tools standard in top global companies.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive "How It Works" Timeline */}
      <section id="how-it-works" className="py-5 bg-white">
        <div className="container">
          <div className="text-center max-width-600 mx-auto mb-5">
            <span className="text-success fw-semibold small uppercase">Process Flow</span>
            <h2 className="fw-bold mt-2 text-dark">How MentorConnect Works</h2>
            <p className="text-muted small">We streamline connections so you can focus on career growth.</p>
          </div>

          <div className="row g-4 justify-content-center">
            <div className="col-lg-4">
              <div className="text-center p-3 border rounded-4 bg-light h-100">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold fs-4 mb-3" style={{width: 50, height: 50}}>1</div>
                <h5 className="fw-bold mb-2 text-dark">Create Account</h5>
                <p className="text-muted small mb-0">Register as either a rural student seeking guidance or an urban professional ready to give back. Build your profile highlighting goals or expertise.</p>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="text-center p-3 border rounded-4 bg-light h-100">
                <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold fs-4 mb-3" style={{width: 50, height: 50}}>2</div>
                <h5 className="fw-bold mb-2 text-dark">Get Matched</h5>
                <p className="text-muted small mb-0">Admin approves users and pairs mentees with ideal mentors. Or, students can request connections from our directory of verified experts.</p>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="text-center p-3 border rounded-4 bg-light h-100">
                <div className="bg-warning text-dark rounded-circle d-inline-flex align-items-center justify-content-center fw-bold fs-4 mb-3" style={{width: 50, height: 50}}>3</div>
                <h5 className="fw-bold mb-2 text-dark">Attend Sessions & Learn</h5>
                <p className="text-muted small mb-0">Schedule video calls directly in-app, share resources, collaborate on documents in real-time, and check milestones off your career progress dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-5 bg-light text-center">
        <div className="container" style={{ maxWidth: 800 }}>
          <span className="text-primary fw-semibold small uppercase">Impact Stories</span>
          <h2 className="fw-bold mt-2 mb-4 text-dark">Hear From Our Users</h2>
          
          <div id="testimonialCarousel" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-inner card-box bg-white border-0 py-5 px-4 rounded-4 shadow-sm">
              <div className="carousel-item active">
                <p className="lead fs-5 italic text-muted">"Coming from a small village, I had no access to software engineers. Through MentorConnect, my mentor Ritika guided me through web development, helped edit my resume, and coached me for interview loops. I recently landed my junior engineer job!"</p>
                <h6 className="fw-bold text-primary mt-3 mb-1">Ramesh Kumar</h6>
                <span className="text-muted small">Mentee, Software Developer</span>
              </div>
              <div className="carousel-item">
                <p className="lead fs-5 italic text-muted">"It's extremely fulfilling to witness direct career progress in these students. Ramesh was eager to learn and just needed practical guidance on software engineering. Spending an hour a week makes a massive difference in their lives."</p>
                <h6 className="fw-bold text-success mt-3 mb-1">Ritika Anand</h6>
                <span className="text-muted small">Mentor, Senior Design Engineer</span>
              </div>
              <div className="carousel-item">
                <p className="lead fs-5 italic text-muted">"The structure of the career progress checklists, the live video call environment, and shared notes make coordination seamless. This platform is a game changer for rural accessibility to quality mentorship."</p>
                <h6 className="fw-bold text-warning mt-3 mb-1">Pradeep D.</h6>
                <span className="text-muted small">Platform Coordinator & Educator</span>
              </div>
            </div>
            
            <button className="carousel-control-prev" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="prev" aria-label="Previous">
              <span className="carousel-control-prev-icon bg-dark rounded-circle" aria-hidden="true" style={{width: 30, height: 30}}></span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#testimonialCarousel" data-bs-slide="next" aria-label="Next">
              <span className="carousel-control-next-icon bg-dark rounded-circle" aria-hidden="true" style={{width: 30, height: 30}}></span>
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact-us" className="py-5 bg-white">
        <div className="container" style={{ maxWidth: 650 }}>
          <div className="text-center mb-4">
            <span className="text-danger fw-semibold small uppercase">Get in Touch</span>
            <h2 className="fw-bold mt-2 text-dark">Contact Platform Support</h2>
            <p className="text-muted small">Questions about enrollment, corporate sponsorship, or platform features? Drop us a line.</p>
          </div>

          <div className="card-box bg-light border-0 p-4 rounded-4">
            {formStatus && <div className="alert alert-success small mb-3">{formStatus}</div>}
            {formErr && <div className="alert alert-danger small mb-3">{formErr}</div>}
            
            <form onSubmit={handleContactSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-control bg-white" 
                  placeholder="e.g. Ramesh Dev" 
                  value={contactName} 
                  onChange={e => setContactName(e.target.value)} 
                  required 
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-control bg-white" 
                  placeholder="name@example.com" 
                  value={contactEmail} 
                  onChange={e => setContactEmail(e.target.value)} 
                  required 
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Message Details</label>
                <textarea 
                  className="form-control bg-white" 
                  rows="4" 
                  placeholder="How can we help you?" 
                  value={contactMessage} 
                  onChange={e => setContactMessage(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold rounded-3">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white-50 py-5 border-top border-secondary">
        <div className="container">
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <h5 className="fw-bold text-white mb-2"><i className="bi bi-rocket-takeoff-fill text-info me-2"></i>MentorConnect</h5>
              <p className="small mb-0" style={{ maxWidth: 400 }}>A unified enterprise-grade digital platform connecting urban expertise with rural students to cultivate skills, build portfolios, and enable equal opportunities.</p>
            </div>
            <div className="col-6 col-md-3">
              <h6 className="fw-bold text-white mb-3">Links</h6>
              <ul className="list-unstyled mb-0">
                <li className="mb-2"><Link to="/login" className="text-white-50 text-decoration-none small">Login Portal</Link></li>
                <li className="mb-2"><Link to="/signup" className="text-white-50 text-decoration-none small">Student Signup</Link></li>
                <li><Link to="/signup" className="text-white-50 text-decoration-none small">Mentor Signup</Link></li>
              </ul>
            </div>
            <div className="col-6 col-md-3">
              <h6 className="fw-bold text-white mb-3">Resources</h6>
              <ul className="list-unstyled mb-0">
                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none small">Platform Guidelines</a></li>
                <li className="mb-2"><a href="#" className="text-white-50 text-decoration-none small">Rural Opportunities</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none small">Sponsor Outreach</a></li>
              </ul>
            </div>
          </div>
          
          <hr className="border-secondary mb-4" />
          
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <small>© 2026 Urban Rural Mentor Mentee Connection. All rights reserved.</small>
            <div className="d-flex gap-3">
              <a href="#" className="text-white-50 fs-5"><i className="bi bi-facebook"></i></a>
              <a href="#" className="text-white-50 fs-5"><i className="bi bi-twitter"></i></a>
              <a href="#" className="text-white-50 fs-5"><i className="bi bi-linkedin"></i></a>
              <a href="#" className="text-white-50 fs-5"><i className="bi bi-instagram"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Home
