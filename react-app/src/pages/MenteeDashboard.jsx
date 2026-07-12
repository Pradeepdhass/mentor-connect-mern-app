import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore'

function MenteeDashboard() {
  const { userData: menteeUser, loading, logout } = useAuth()
  const navigate = useNavigate()

  // Navigation tab
  const [activeTab, setActiveTab] = useState('dashboard')

  // Data States
  const [mentorsList, setMentorsList] = useState([])
  const [mySessions, setMySessions] = useState([])
  const [resourcesList, setResourcesList] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  
  // Profile Form States
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [goals, setGoals] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [skillFilter, setSkillFilter] = useState('all')

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingMentor, setBookingMentor] = useState(null)
  const [bookingTitle, setBookingTitle] = useState('Career Mentoring')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingMsg, setBookingMsg] = useState('')
  const [bookingErr, setBookingErr] = useState('')

  // Feedback State
  const [feedMsg, setFeedMsg] = useState('')
  const [feedRating, setFeedRating] = useState('5')
  const [feedText, setFeedText] = useState('')
  const [feedSuccess, setFeedSuccess] = useState('')

  // Milestones State
  const [milestones, setMilestones] = useState({
    profileSet: false,
    resumeDone: false,
    skillTest: false,
    mockInterview: false
  })

  useEffect(() => {
    if (loading) return
    if (!menteeUser || menteeUser.role !== 'mentee') {
      navigate('/login')
      return
    }
    // Set form fields
    setName(menteeUser.name || '')
    setBio(menteeUser.bio || '')
    setGoals(menteeUser.goals || '')
    
    // Load milestones from user doc
    if (menteeUser.milestones) {
      setMilestones({ ...milestones, ...menteeUser.milestones })
    }
    
    loadDashboardData()
  }, [menteeUser, loading, navigate])

  const loadDashboardData = async () => {
    setDataLoading(true)
    try {
      // 1. Fetch Approved Mentors
      const mentorsSnap = await getDocs(collection(db, "mentors"))
      const allMentors = mentorsSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
      // Filter only approved ones (or default status)
      setMentorsList(allMentors.filter(m => m.status === 'approved' || !m.status))

      // 2. Fetch Sessions for this mentee
      const sessionsSnap = await getDocs(query(collection(db, "sessions"), where("menteeEmail", "==", menteeUser.email)))
      const fetchedSessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      // sort by date/time
      fetchedSessions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setMySessions(fetchedSessions)

      // 3. Fetch announcements
      const annSnap = await getDocs(collection(db, "announcements"))
      const fetchedAnn = annSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAnnouncements(fetchedAnn.filter(a => a.targetRole === 'all' || a.targetRole === 'mentee'))

      // 4. Fetch Shared Resources
      const resSnap = await getDocs(collection(db, "resources"))
      const fetchedRes = resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setResourcesList(fetchedRes)

    } catch (err) {
      console.error(err)
    } finally {
      setDataLoading(false)
    }
  }

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setEditSuccess('Saving...')
    try {
      const userRef = doc(db, "mentees", menteeUser.uid)
      await updateDoc(userRef, {
        name,
        bio,
        goals
      })
      setEditSuccess('✅ Profile details updated successfully!')
      setTimeout(() => setEditSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setEditSuccess('❌ Failed to update profile details.')
    }
  }

  // Handle Milestone Checkboxes
  const handleMilestoneToggle = async (key) => {
    const updatedMilestones = { ...milestones, [key]: !milestones[key] }
    setMilestones(updatedMilestones)
    try {
      const userRef = doc(db, "mentees", menteeUser.uid)
      await updateDoc(userRef, {
        milestones: updatedMilestones
      })
    } catch (err) {
      console.error(err)
    }
  }

  // Calculate Progress Percent
  const getProgressPercent = () => {
    const total = Object.keys(milestones).length
    const checked = Object.values(milestones).filter(Boolean).length
    return Math.round((checked / total) * 100)
  }

  // Handle Book Session
  const handleBookSessionSubmit = async (e) => {
    e.preventDefault()
    if (!bookingDate || !bookingTime) {
      setBookingErr('Date and time are required.')
      return
    }
    setBookingMsg('Processing booking request...')
    setBookingErr('')

    try {
      await addDoc(collection(db, "sessions"), {
        menteeEmail: menteeUser.email,
        menteeName: menteeUser.name,
        mentorEmail: bookingMentor.email,
        mentorName: bookingMentor.name,
        title: bookingTitle,
        date: bookingDate,
        time: bookingTime,
        status: 'pending',
        createdAt: new Date().toISOString(),
        notes: ''
      })
      
      setBookingMsg('✅ Session request sent to mentor!')
      setBookingDate('')
      setBookingTime('')
      loadDashboardData()
      setTimeout(() => {
        setShowBookingModal(false)
        setBookingMsg('')
      }, 1500)
    } catch (err) {
      console.error(err)
      setBookingErr('❌ Failed to book session. Please try again.')
      setBookingMsg('')
    }
  }

  // Submit Feedback / Review
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    if (!feedText.trim()) {
      setFeedSuccess('Please write your review first.')
      return
    }
    setFeedSuccess('Submitting review...')
    
    // Choose mentor to leave feedback for
    let targetMentorEmail = menteeUser.assignedMentorEmail || ''
    if (!targetMentorEmail && mentorsList.length > 0) {
      targetMentorEmail = mentorsList[0].email // default to first mentor if unassigned
    }

    if (!targetMentorEmail) {
      setFeedSuccess('❌ No available mentor to leave review for.')
      return
    }

    try {
      await addDoc(collection(db, "feedback"), {
        menteeEmail: menteeUser.email,
        menteeName: menteeUser.name,
        mentorEmail: targetMentorEmail,
        message: feedText,
        rating: Number(feedRating),
        createdAt: new Date().toISOString()
      })
      setFeedSuccess('✅ Thank you! Review submitted successfully.')
      setFeedText('')
      loadDashboardData()
      setTimeout(() => setFeedSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setFeedSuccess('❌ Failed to submit review.')
    }
  }

  // Filter Mentors
  const filteredMentors = mentorsList.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const skillsLower = (m.skills || '').toLowerCase()
    const matchesSkill = skillFilter === 'all' || skillsLower.includes(skillFilter.toLowerCase())
    return matchesSearch && matchesSkill
  })

  // Get next upcoming approved session
  const upcomingSession = mySessions.find(s => s.status === 'approved' && new Date(s.date) >= new Date().setHours(0,0,0,0))

  return (
    <div className="container-fluid">
      <div className="row">
        
        {/* Desktop Sidebar (hidden on mobile) */}
        <nav className="col-md-3 col-lg-2 sidebar d-none d-md-flex">
  <div className="sidebar-header d-flex align-items-center py-2">
    <img src="/images/logo.png" alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} className="me-2 rounded-circle" />
    <span className="fw-semibold medium">MentorConnect</span>
  </div>


          <div className="sidebar-profile text-center">
            <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 fw-bold" style={{width: 45, height: 45, fontSize: '1.2rem'}}>
              {menteeUser?.name?.charAt(0)}
            </div>
            <h6 className="fw-semibold mb-1 text-truncate" style={{fontSize: '0.9rem'}}>{name || 'Mentee'}</h6>
            <span className="badge bg-success-subtle text-success small">Student Mentee</span>
          </div>

          <ul className="nav flex-column flex-grow-1">
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <i className="bi bi-speedometer2"></i>Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'find' ? 'active' : ''}`} onClick={() => setActiveTab('find')}>
                <i className="bi bi-search"></i>Find Mentor
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
                <i className="bi bi-calendar-check"></i>My Sessions
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>
                <i className="bi bi-book-fill"></i>Study Resources
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
                <i className="bi bi-bar-chart-line-fill"></i>My Progress
              </button>
            </li>
            <li className="nav-item text-center mt-3 px-2">
              <Link to="/messages" className="btn btn-outline-primary btn-sm w-100 rounded-3">
                <i className="bi bi-chat-dots-fill me-1"></i>Open Chat
              </Link>
            </li>
            
            <div className="sidebar-divider"></div>
            
            <li className="nav-item">
              <button className="nav-link border-0 text-start bg-transparent text-danger w-100" onClick={logout}>
                <i className="bi bi-box-arrow-right"></i>Logout
              </button>
            </li>
          </ul>
        </nav>

        {/* Mobile Header (visible on mobile only) */}
        <div className="d-flex d-md-none justify-content-between align-items-center p-3 bg-white border-bottom shadow-sm w-100">
          <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
            <img src="/images/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} className="me-2 rounded-circle" />
            <span>MentorConnect</span>
          </Link>
          <button className="btn btn-outline-secondary btn-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar">
            <i className="bi bi-list fs-4"></i>
          </button>
        </div>

        {/* Mobile Sidebar Offcanvas */}
        <div className="offcanvas offcanvas-start d-md-none" tabIndex="-1" id="mobileSidebar" style={{ maxWidth: 280 }}>
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title fw-bold" id="mobileSidebarLabel">Mentee Menu</h5>
            <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body sidebar p-3">
            <div className="sidebar-profile text-center mb-3">
              <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 fw-bold" style={{width: 45, height: 45, fontSize: '1.2rem'}}>
                {menteeUser?.name?.charAt(0)}
              </div>
              <h6 className="fw-semibold mb-1 text-truncate" style={{fontSize: '0.9rem'}}>{name || 'Mentee'}</h6>
              <span className="badge bg-success-subtle text-success small">Student Mentee</span>
            </div>

            <ul className="nav flex-column flex-grow-1">
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'dashboard' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('dashboard')}>
                  <i className="bi bi-speedometer2"></i>Dashboard
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'find' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('find')}>
                  <i className="bi bi-search"></i>Find Mentor
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'sessions' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('sessions')}>
                  <i className="bi bi-calendar-check"></i>My Sessions
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'resources' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('resources')}>
                  <i className="bi bi-book-fill"></i>Study Resources
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'progress' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('progress')}>
                  <i className="bi bi-bar-chart-line-fill"></i>My Progress
                </button>
              </li>
              <li className="nav-item text-center mt-3 px-2">
                <Link to="/messages" className="btn btn-outline-primary btn-sm w-100 rounded-3">
                  <i className="bi bi-chat-dots-fill me-1"></i>Open Chat
                </Link>
              </li>
              
              <div className="sidebar-divider"></div>
              
              <li className="nav-item">
                <button className="nav-link border-0 text-start bg-transparent text-danger w-100" data-bs-dismiss="offcanvas" onClick={logout}>
                  <i className="bi bi-box-arrow-right"></i>Logout
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Panel */}
        <main className="col-md-9 col-lg-10 p-4" style={{minHeight: '100vh', background: '#f8fafc'}}>
          
          {/* Header */}
          <header className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="text-muted small">Academic Mentorship Portal</span>
              <h4 className="fw-bold mb-0">Student Dashboard</h4>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <i className="bi bi-bell text-muted fs-5 cursor-pointer"></i>
              <div className="d-flex align-items-center gap-2 ps-3 border-start">
                <i className="bi bi-circle-fill text-success small animate__animated animate__flash animate__infinite"></i>
                <span className="small fw-semibold">Mentee Account</span>
              </div>
            </div>
          </header>

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Upper Stats grid */}
              <div className="row g-3 mb-4">
                
                {/* Mentor Card Widget */}
                <div className="col-md-4">
                  <div className="widget-card card-box border-start border-primary border-4 p-3 bg-white h-100">
                    <h6 className="text-muted small fw-semibold">Assigned Mentor Professional</h6>
                    {menteeUser?.assignedMentorName ? (
                      <div className="mt-2">
                        <h5 className="fw-bold text-primary mb-0">{menteeUser.assignedMentorName}</h5>
                        <small className="text-muted d-block">{menteeUser.assignedMentorEmail}</small>
                        <span className="badge bg-primary-subtle text-primary mt-2 small">Direct Connection</span>
                      </div>
                    ) : (
                      <div className="mt-2 text-danger small fw-semibold">
                        <i className="bi bi-info-circle me-1"></i> No mentor assigned yet. <br/>
                        <button className="btn btn-sm btn-link text-primary p-0 mt-1" onClick={() => setActiveTab('find')}>Find a mentor now</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming session Widget */}
                <div className="col-md-4">
                  <div className="widget-card success card-box border-start border-success border-4 p-3 bg-white h-100">
                    <h6 className="text-muted small fw-semibold">Next Scheduled Call</h6>
                    {upcomingSession ? (
                      <div className="mt-2">
                        <h6 className="fw-bold text-success mb-1">{upcomingSession.title}</h6>
                        <small className="text-muted d-block">With {upcomingSession.mentorName}</small>
                        <small className="fw-semibold text-dark">{upcomingSession.date} at {upcomingSession.time}</small>
                        <div className="mt-2">
                          <Link to={`/video-call/${upcomingSession.id}`} className="btn btn-xs btn-success text-white py-1 px-2 rounded small fw-semibold">Join Call Room</Link>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-muted small">
                        No upcoming sessions scheduled.<br/>
                        {menteeUser?.assignedMentorEmail ? (
                          <button className="btn btn-sm btn-link text-success p-0 mt-1" onClick={() => {
                            setBookingMentor({ email: menteeUser.assignedMentorEmail, name: menteeUser.assignedMentorName });
                            setShowBookingModal(true);
                          }}>Book a session now</button>
                        ) : 'Connect with a mentor first.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar Widget */}
                <div className="col-md-4">
                  <div className="widget-card warning card-box border-start border-warning border-4 p-3 bg-white h-100">
                    <h6 className="text-muted small fw-semibold">Overall Career Progress</h6>
                    <div className="mt-2">
                      <h4 className="fw-bold text-warning mb-1">{getProgressPercent()}% Completed</h4>
                      <div className="progress rounded-pill mt-2" style={{height: 8}}>
                        <div className="progress-bar bg-warning" role="progressbar" style={{width: `${getProgressPercent()}%`}} aria-valuenow={getProgressPercent()} aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                      <small className="text-muted d-block mt-2" style={{fontSize: '0.75rem'}}>Check milestones in "My Progress" tab.</small>
                    </div>
                  </div>
                </div>

              </div>

              {/* Lower dashboard area: announcements & quick reviews */}
              <div className="row g-4">
                
                {/* Announcements Feed */}
                <div className="col-md-6">
                  <div className="card-box bg-white h-100">
                    <h5 className="fw-bold mb-3"><i className="bi bi-megaphone me-2 text-primary"></i>Platform Announcements</h5>
                    {announcements.length === 0 ? (
                      <div className="text-center py-4 text-muted small">No active announcements.</div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {announcements.slice(0, 3).map(a => (
                          <div key={a.id} className="list-group-item px-0 py-2 border-bottom">
                            <h6 className="fw-bold mb-1 small">{a.title}</h6>
                            <p className="text-muted small mb-0">{a.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Reviews Form */}
                <div className="col-md-6">
                  <div className="card-box bg-white h-100">
                    <h5 className="fw-bold mb-3"><i className="bi bi-star-fill text-warning me-2"></i>Review Your Mentor</h5>
                    {feedSuccess && <div className="alert alert-info py-2 small">{feedSuccess}</div>}
                    <form onSubmit={handleFeedbackSubmit}>
                      <div className="mb-2">
                        <label className="form-label small">Select Rating Score</label>
                        <select className="form-select form-select-sm" value={feedRating} onChange={e => setFeedRating(e.target.value)}>
                          <option value="5">5★ (Excellent Guide)</option>
                          <option value="4">4★ (Good Help)</option>
                          <option value="3">3★ (Average)</option>
                          <option value="2">2★ (Poor Quality)</option>
                          <option value="1">1★ (Terrible)</option>
                        </select>
                      </div>
                      
                      <div className="mb-2">
                        <textarea className="form-control form-control-sm" rows="3" placeholder="Share your experience working with your mentor..." value={feedText} onChange={e => setFeedText(e.target.value)} required />
                      </div>
                      <button className="btn btn-sm btn-primary" type="submit">Submit Feedback</button>
                    </form>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: FIND MENTOR */}
          {activeTab === 'find' && (
            <div className="card-box bg-white">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
                <h5 className="fw-bold mb-0">Browse Verified Urban Mentors</h5>
                
                <div className="d-flex flex-wrap gap-2 w-100 w-sm-auto">
                  <div className="input-group input-group-sm" style={{maxWidth: 240}}>
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <input type="text" className="form-control" placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  
                  <select className="form-select form-select-sm" style={{maxWidth: 160}} value={skillFilter} onChange={e => setSkillFilter(e.target.value)}>
                    <option value="all">All Skills</option>
                    <option value="React">React / Web</option>
                    <option value="Design">UI/UX Design</option>
                    <option value="Tech">Technology</option>
                    <option value="Python">Python</option>
                  </select>
                </div>
              </div>

              {dataLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : filteredMentors.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-person-x fs-1"></i>
                  <p className="mt-2 mb-0 small">No mentors found matching your filters.</p>
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                  {filteredMentors.map(m => (
                    <div className="col" key={m.uid}>
                      <div className="border rounded-4 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold small" style={{width: 32, height: 32}}>
                              {m.name?.charAt(0)}
                            </div>
                            <h6 className="fw-bold mb-0 text-dark">{m.name}</h6>
                          </div>
                          
                          <p className="small text-muted mb-2 text-truncate">{m.email}</p>
                          <p className="small text-dark mb-3" style={{minHeight: 38, fontSize: '0.85rem'}}>
                            {m.bio || 'Experienced professional ready to coach rural students.'}
                          </p>

                          <div className="mb-3">
                            {m.skills ? m.skills.split(',').map((s, idx) => (
                              <span key={idx} className="badge bg-secondary-subtle text-secondary me-1 small" style={{fontSize: '0.75rem'}}>{s.trim()}</span>
                            )) : <span className="text-muted small" style={{fontSize: '0.75rem'}}>General mentorship</span>}
                          </div>
                        </div>

                        <button className="btn btn-sm btn-primary w-100 rounded-3 mt-auto" onClick={() => { setBookingMentor(m); setShowBookingModal(true); }}>
                          <i className="bi bi-calendar-event me-2"></i>Book Video Call
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="card-box bg-white">
              <h5 className="fw-bold mb-4">My Booked Sessions</h5>
              {dataLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : mySessions.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-calendar-x fs-1"></i>
                  <p className="mt-2 mb-0 small">No sessions booked yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Topic</th>
                        <th>Mentor</th>
                        <th>Scheduled For</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySessions.map(s => (
                        <tr key={s.id}>
                          <td><span className="fw-semibold">{s.title}</span></td>
                          <td>{s.mentorName}</td>
                          <td>{s.date} at {s.time}</td>
                          <td>
                            <span className={`badge ${s.status === 'approved' ? 'bg-success' : s.status === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="text-end">
                            {s.status === 'approved' && (
                              <Link to={`/video-call/${s.id}`} className="btn btn-sm btn-success text-white">
                                <i className="bi bi-camera-video me-1"></i> Join Call
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: STUDY RESOURCES */}
          {activeTab === 'resources' && (
            <div className="card-box bg-white">
              <h5 className="fw-bold mb-4">Educational Resources Shared</h5>
              {dataLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : resourcesList.length === 0 ? (
                <div className="row g-3">
                  {/* Default fallback mockup materials */}
                  <div className="col-md-6">
                    <div className="card border p-3 rounded-4 bg-light">
                      <span className="badge bg-primary-subtle text-primary mb-2 align-self-start">PDF Guide</span>
                      <h6 className="fw-bold">Intro to Web Technologies</h6>
                      <p className="text-muted small">Learn basics of HTML, CSS, JavaScript, and developer tools.</p>
                      <a href="https://www.w3schools.com" target="_blank" className="btn btn-sm btn-outline-primary align-self-start mt-2">Open Resource</a>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card border p-3 rounded-4 bg-light">
                      <span className="badge bg-success-subtle text-success mb-2 align-self-start">Video Class</span>
                      <h6 className="fw-bold">React Framework Course</h6>
                      <p className="text-muted small">A step by step tutorial to build responsive single page apps.</p>
                      <a href="https://react.dev" target="_blank" className="btn btn-sm btn-outline-success align-self-start mt-2">Watch Tutorial</a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  {resourcesList.map(res => (
                    <div className="col-md-6" key={res.id}>
                      <div className="card border p-3 rounded-4 bg-light">
                        <span className="badge bg-primary-subtle text-primary mb-2 align-self-start">{res.type || 'Material'}</span>
                        <h6 className="fw-bold">{res.title}</h6>
                        <p className="text-muted small">{res.description}</p>
                        <a href={res.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary align-self-start mt-2">Open Link</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PROGRESS TRACKER */}
          {activeTab === 'progress' && (
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card-box bg-white">
                  <h5 className="fw-bold mb-3">Goal Progress Checkpoints</h5>
                  <p className="text-muted small">Review your career goals. Complete these checkpoints with your mentor to finish the course cycle.</p>
                  
                  <div className="list-group list-group-flush">
                    <div className="milestone-item list-group-item px-0">
                      <div className="form-check w-100">
                        <input className="form-check-input" type="checkbox" id="profileSet" checked={milestones.profileSet} onChange={() => handleMilestoneToggle('profileSet')} />
                        <label className="form-check-label fw-semibold" htmlFor="profileSet">1. Complete profile introduction bio & goals</label>
                      </div>
                    </div>

                    <div className="milestone-item list-group-item px-0">
                      <div className="form-check w-100">
                        <input className="form-check-input" type="checkbox" id="resumeDone" checked={milestones.resumeDone} onChange={() => handleMilestoneToggle('resumeDone')} />
                        <label className="form-check-label fw-semibold" htmlFor="resumeDone">2. Resume draft and portfolio review session</label>
                      </div>
                    </div>

                    <div className="milestone-item list-group-item px-0">
                      <div className="form-check w-100">
                        <input className="form-check-input" type="checkbox" id="skillTest" checked={milestones.skillTest} onChange={() => handleMilestoneToggle('skillTest')} />
                        <label className="form-check-label fw-semibold" htmlFor="skillTest">3. Complete online technical/business skills evaluation</label>
                      </div>
                    </div>

                    <div className="milestone-item list-group-item px-0">
                      <div className="form-check w-100">
                        <input className="form-check-input" type="checkbox" id="mockInterview" checked={milestones.mockInterview} onChange={() => handleMilestoneToggle('mockInterview')} />
                        <label className="form-check-label fw-semibold" htmlFor="mockInterview">4. Complete live mock project review/interview session</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Detail */}
              <div className="col-md-6">
                <div className="card-box bg-white text-center py-5">
                  <i className="bi bi-award-fill text-warning display-3 mb-3"></i>
                  <h4 className="fw-bold">Milestones Status Tracker</h4>
                  <h2 className="display-4 fw-bold text-primary mt-2">{getProgressPercent()}%</h2>
                  <p className="text-muted small">Completed checks: {Object.values(milestones).filter(Boolean).length} of 4</p>
                  
                  {getProgressPercent() === 100 ? (
                    <div className="alert alert-success mx-4 small py-2 mt-3">
                      🎉 Congratulations! You have successfully completed all career mentoring checkpoints.
                    </div>
                  ) : (
                    <p className="small text-muted px-4 mt-3">Complete all checklist items with your urban professional mentor to qualify for industry certifications.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* BOOKING MODAL */}
      {showBookingModal && bookingMentor && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Request Mentoring Video Call</h5>
                <button type="button" className="btn-close" onClick={() => setShowBookingModal(false)}></button>
              </div>
              <form onSubmit={handleBookSessionSubmit}>
                <div className="modal-body py-0">
                  <p className="small text-muted">Submit date & time parameters to schedule a session with mentor <strong>{bookingMentor.name}</strong>.</p>
                  
                  {bookingMsg && <div className="alert alert-success py-2 small">{bookingMsg}</div>}
                  {bookingErr && <div className="alert alert-danger py-2 small">{bookingErr}</div>}

                  <div className="mb-3">
                    <label className="form-label">Call Focus Topic</label>
                    <select className="form-select" value={bookingTitle} onChange={e => setBookingTitle(e.target.value)}>
                      <option value="Career Mentoring">General Career Guidance</option>
                      <option value="Resume Review">Resume & Profile Review</option>
                      <option value="Skill Development">Tech Skill Mentorship</option>
                      <option value="Mock Interview">Mock Interview Prep</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Meeting Date</label>
                    <input type="date" className="form-control" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Meeting Time</label>
                    <input type="time" className="form-control" value={bookingTime} onChange={e => setBookingTime(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-footer border-top-0">
                  <button type="submit" className="btn btn-sm btn-primary">Submit Booking</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowBookingModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default MenteeDashboard
