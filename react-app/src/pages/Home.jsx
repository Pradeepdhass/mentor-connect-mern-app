import { useEffect } from 'react'
import { Link } from 'react-router-dom'

function Home() {
  useEffect(() => {
    const toggle = document.getElementById('darkModeToggle')
    const body = document.body
    if (toggle) {
      const onChange = function () {
        body.classList.toggle('dark-mode')
        localStorage.setItem('theme', this.checked ? 'dark' : 'light')
      }
      toggle.addEventListener('change', onChange)
      if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode')
        toggle.checked = true
      }
      return () => toggle.removeEventListener('change', onChange)
    }
  }, [])

  return (
    <>
      <nav className="navbar navbar-expand-lg custom-navbar sticky-top shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold text-light" href="#">
            <i className="bi bi-lightning-charge-fill me-2 text-info"></i>MentorConnect
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-2 gap-lg-0">
              <li className="nav-item"><a className="nav-link active" href="#">Home</a></li>
              <li className="nav-item"><Link className="nav-link" to="/signup">Sign Up</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
              <li className="nav-item"><a className="nav-link" href="#faq-section">FAQ</a></li>
              <li className="nav-item dropdown">
                <a className="nav-link  d-flex align-items-center gap-1" href="#" id="resourcesDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Resources <span className="small">▼</span></a>
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="resourcesDropdown">
                  <li><a className="dropdown-item" href="#">Tutorials</a></li>
                  <li><a className="dropdown-item" href="#">Community Forum</a></li>
                  <li><hr className="dropdown-divider"/></li>
                  <li><a className="dropdown-item" href="#">Support</a></li>
                </ul>
              </li>
            </ul>
            <div className="form-check form-switch ms-lg-3 mt-2 mt-lg-0">
              <input className="form-check-input" type="checkbox" id="darkModeToggle" />
              <label className="form-check-label text-white" htmlFor="darkModeToggle">Dark Mode</label>
            </div>
          </div>
        </div>
      </nav>

      <section className="hero position-relative ">
        <div id="heroCarousel" className="carousel slide carousel-fade position-absolute top-0 start-0 w-100 h-100" data-bs-ride="carousel" data-bs-interval="5000" style={{ zIndex: 0 }}>
          <div className="carousel-inner h-100">
            <div className="carousel-item active">
              <img src="/images/img1.png" className="d-block w-100 carousel-img" alt="Slide 1" />
            </div>
            <div className="carousel-item">
              <img src="/images/img2.jpg" className="d-block w-100 carousel-img" alt="Slide 2" />
            </div>
            <div className="carousel-item">
              <img src="/images/img3.jpg" className="d-block w-100 carousel-img" alt="Slide 3" />
            </div>
          </div>
        </div>

        <div className="container glass-cards no-dark-mode position-relative text-white text-center py-5 px-4" style={{ zIndex: 1 }}>
          <h1 className="display-4 fw-bold mb-3 text-shadow">Welcome to <span className="text-accent">MentorConnect</span></h1>
          <p className="lead mb-4 text-light">Seamlessly connect with mentors and mentees tailored to your goals, expertise, and availability.</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/signup" className="btn btn-lg btn-accent px-5 shadow-sm">Get Started</Link>
            <Link to="/login" className="btn btn-lg btn-outline-light px-5 shadow-sm">Login</Link>
          </div>
        </div>
      </section>

      <section className="how-it-works py-5 text-center bg-light">
        <div className="container">
          <h2 className="mb-4 fw-bold text-dark">How <span className="text-primary">MentorConnect</span> Works</h2>
          <p className="text-muted mb-5">A simple, effective, and guided way to connect mentors and mentees.</p>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="p-3 bg-white border border-info rounded h-100">
                <div className="mb-3 text-info"><i className="bi bi-person-plus-fill fs-2"></i></div>
                <h5 className="fw-semibold">1. Create Your Profile</h5>
                <p className="text-muted">Sign up and showcase your skills, goals, and preferences as a mentor or mentee.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 bg-white border border-success rounded h-100">
                <div className="mb-3 text-success"><i className="bi bi-link fs-2"></i></div>
                <h5 className="fw-semibold">2. Get Matched</h5>
                <p className="text-muted">Our intelligent algorithm recommends the best match based on your profile and needs.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 bg-white border border-primary rounded h-100">
                <div className="mb-3 text-primary"><i className="bi bi-chat-dots-fill fs-2"></i></div>
                <h5 className="fw-semibold">3. Connect & Grow</h5>
                <p className="text-muted">Start your mentoring journey with tools, communication, and guidance in one platform.</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/signup" className="btn btn-primary px-4">Join MentorConnect</Link>
          </div>
        </div>
      </section>

      <section className="features-section py-4 bg-light text-center">
        <div className="container">
          <h2 className="mb-3">Why Choose <span className="text-primary">MentorConnect</span>?</h2>
          <p className="text-muted mb-4">We bring mentors and mentees together through innovation and care.</p>
          <div className="row">
            <div className="col-md-4 mb-3">
              <div className="p-3 bg-white border border-info rounded h-100">
                <div className="mb-3 text-info"><i className="bi bi-person-plus-fill fs-2"></i></div>
                <h5>Community-Driven</h5>
                <p className="text-muted">Join a supportive network of like-minded professionals and learners.</p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="p-3 bg-white border border-success rounded h-100">
                <div className="mb-3 text-success"><i className="bi bi-speedometer2 fs-2"></i></div>
                <h5>Fast Matching</h5>
                <p className="text-muted">Get matched instantly with mentors or mentees that suit your goals.</p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="p-3 bg-white border border-primary rounded h-100">
                <div className="mb-3 text-primary"><i className="bi bi-globe2 fs-2"></i></div>
                <h5>Global Access</h5>
                <p className="text-muted">Connect across countries with people who share your vision and passion.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-4 bg-light text-center">
        <div className="container">
          <h2 className="mb-3">What Our Users Say</h2>
          <p className="text-muted mb-4">Stories from people who’ve benefited from MentorConnect.</p>
          <div className="row">
            <div className="col-md-4 mb-4">
              <blockquote>
                <p>"MentorConnect helped me find a mentor who truly understands my goals."</p>
                <footer className="blockquote-footer">Pradeep R., Software Engineer</footer>
              </blockquote>
            </div>
            <div className="col-md-4 mb-4">
              <blockquote>
                <p>"As a mentor, it’s been amazing to guide students and professionals worldwide."</p>
                <footer className="blockquote-footer">Arun S., Tech Lead & Mentor</footer>
              </blockquote>
            </div>
            <div className="col-md-4 mb-4">
              <blockquote>
                <p>"I found a mentor who helped me navigate my career switch. Forever grateful!"</p>
                <footer className="blockquote-footer">Prasanna V., UX Designer</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="py-3 text-center bg-light">
        <div className="container">
          <div className="row">
            <div className="col-6 col-md-3 mb-3"><div><i className="bi bi-person-check fs-3"></i></div><p>Verified Mentors</p></div>
            <div className="col-6 col-md-3 mb-3"><div><i className="bi bi-graph-up-arrow fs-3"></i></div><p>Career Growth</p></div>
            <div className="col-6 col-md-3 mb-3"><div><i className="bi bi-clock-history fs-3"></i></div><p>Flexible Sessions</p></div>
            <div className="col-6 col-md-3 mb-3"><div><i className="bi bi-stars fs-3"></i></div><p>Expertise-Based Match</p></div>
          </div>
        </div>
      </section>

      <section className="faq-section py-4 bg-light" id="faq-section">
        <div className="container">
          <h2 className="text-center mb-3">FAQs</h2>
          <div className="accordion" id="faqAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header" id="faqOne">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">What is MentorConnect?</button>
              </h2>
              <div id="collapseOne" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                <div className="accordion-body">MentorConnect is a platform that connects mentors and mentees based on their goals, skills, and interests.</div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="faqTwo">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">Is MentorConnect free to use?</button>
              </h2>
              <div id="collapseTwo" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body">Yes, it offers free access to create profiles and connect. Premium features may be introduced later.</div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="faqThree">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree">Can I be both a mentor and a mentee?</button>
              </h2>
              <div id="collapseThree" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body">Yes! You can mentor in your area of expertise and learn from others in areas you're growing in.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="footer" className="bg-light text-center text-muted py-4 border-top">
        <div className="container">
          <div className="mb-3">
            <a href="#" className="text-muted me-3"><i className="bi bi-facebook"></i></a>
            <a href="#" className="text-muted me-3"><i className="bi bi-twitter"></i></a>
            <a href="#" className="text-muted me-3"><i className="bi bi-instagram"></i></a>
            <a href="#" className="text-muted"><i className="bi bi-linkedin"></i></a>
          </div>
          <small>© 2025 MentorConnect. All rights reserved.</small>
        </div>
      </footer>
    </>
  )
}

export default Home


