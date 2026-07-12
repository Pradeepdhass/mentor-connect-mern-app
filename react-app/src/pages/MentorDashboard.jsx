import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore'

function MentorDashboard() {
  const { userData: mentorUser, loading, logout } = useAuth()
  const navigate = useNavigate()

  // Navigation tab
  const [activeTab, setActiveTab] = useState('dashboard')

  // Data States
  const [assignedMentees, setAssignedMentees] = useState([])
  const [mySessions, setMySessions] = useState([])
  const [reviewsList, setReviewsList] = useState([])
  const [myResources, setMyResources] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  // Profile Form States
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  // Availability Slots builder State
  const [slots, setSlots] = useState([])
  const [newDay, setNewDay] = useState('Monday')
  const [newTime, setNewTime] = useState('17:00')

  // Resource Upload Form State
  const [resTitle, setResTitle] = useState('')
  const [resLink, setResLink] = useState('')
  const [resType, setResType] = useState('PDF Guide')
  const [resDesc, setResDesc] = useState('')
  const [resSuccess, setResSuccess] = useState('')

  useEffect(() => {
    if (loading) return
    if (!mentorUser || mentorUser.role !== 'mentor') {
      navigate('/login')
      return
    }

    setName(mentorUser.name || '')
    setBio(mentorUser.bio || '')
    setSkills(mentorUser.skills || '')
    
    // Load availability slots from user doc
    if (mentorUser.availabilitySlots) {
      setSlots(mentorUser.availabilitySlots)
    }

    loadMentorData()
  }, [mentorUser, loading, navigate])

  const loadMentorData = async () => {
    setDataLoading(true)
    try {
      // 1. Fetch assigned mentees
      const menteesSnap = await getDocs(query(collection(db, "mentees"), where("assignedMentorEmail", "==", mentorUser.email)))
      const fetchedMentees = menteesSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
      setAssignedMentees(fetchedMentees)

      // 2. Fetch Sessions
      const sessionsSnap = await getDocs(query(collection(db, "sessions"), where("mentorEmail", "==", mentorUser.email)))
      const fetchedSessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      fetchedSessions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setMySessions(fetchedSessions)

      // 3. Fetch Feedbacks left for this mentor
      const feedbackSnap = await getDocs(query(collection(db, "feedback"), where("mentorEmail", "==", mentorUser.email)))
      const fetchedReviews = feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      fetchedReviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setReviewsList(fetchedReviews)

      // 4. Fetch Resources uploaded by this mentor
      const resSnap = await getDocs(query(collection(db, "resources"), where("uploaderEmail", "==", mentorUser.email)))
      const fetchedRes = resSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setMyResources(fetchedRes)

    } catch (err) {
      console.error("Error loading mentor data:", err)
    } finally {
      setDataLoading(false)
    }
  }

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setEditSuccess('Saving profile changes...')
    try {
      const userRef = doc(db, "mentors", mentorUser.uid)
      await updateDoc(userRef, {
        name,
        bio,
        skills
      })
      setEditSuccess('✅ Profile updated successfully!')
      setTimeout(() => setEditSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setEditSuccess('❌ Failed to save profile updates.')
    }
  }

  // Session approvals
  const handleApproveSession = async (id, status) => {
    try {
      const sessionRef = doc(db, "sessions", id)
      await updateDoc(sessionRef, { status })
      loadMentorData()
    } catch (err) {
      console.error(err)
    }
  }

  // Add availability slot
  const handleAddSlot = async (e) => {
    e.preventDefault()
    const newSlot = `${newDay} at ${newTime}`
    if (slots.includes(newSlot)) return
    
    const updatedSlots = [...slots, newSlot]
    setSlots(updatedSlots)
    try {
      const userRef = doc(db, "mentors", mentorUser.uid)
      await updateDoc(userRef, { availabilitySlots: updatedSlots })
    } catch (err) {
      console.error(err)
    }
  }

  // Remove availability slot
  const handleRemoveSlot = async (slotToRemove) => {
    const updatedSlots = slots.filter(s => s !== slotToRemove)
    setSlots(updatedSlots)
    try {
      const userRef = doc(db, "mentors", mentorUser.uid)
      await updateDoc(userRef, { availabilitySlots: updatedSlots })
    } catch (err) {
      console.error(err)
    }
  }

  // Handle upload resource link
  const handleUploadResource = async (e) => {
    e.preventDefault()
    if (!resTitle.trim() || !resLink.trim()) {
      setResSuccess('Title and URL link are required.')
      return
    }
    setResSuccess('Uploading...')

    try {
      await addDoc(collection(db, "resources"), {
        title: resTitle,
        link: resLink,
        type: resType,
        description: resDesc,
        uploaderEmail: mentorUser.email,
        createdAt: new Date().toISOString()
      })
      setResSuccess('✅ Learning resource shared with mentees!')
      setResTitle('')
      setResLink('')
      setResDesc('')
      loadMentorData()
      setTimeout(() => setResSuccess(''), 3000)
    } catch (err) {
      console.error(err)
      setResSuccess('❌ Failed to share resource.')
    }
  }

  const pendingCount = mySessions.filter(s => s.status === 'pending').length
  const upcomingSession = mySessions.find(s => s.status === 'approved' && new Date(s.date) >= new Date().setHours(0,0,0,0))

  return (
    <div className="container-fluid">
      <div className="row">

        {/* Desktop Sidebar (hidden on mobile) */}
        <nav className="col-md-3 col-lg-2 sidebar d-none d-md-flex">
           <div className="sidebar-header d-flex align-items-center py-2">
    <i className="bi bi-rocket-takeoff-fill text-primary fs-6 me-1"></i>
    <span className="fw-semibold medium">MentorConnect</span>
  </div>

          <div className="sidebar-profile text-center">
            <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 fw-bold" style={{width: 45, height: 45, fontSize: '1.2rem'}}>
              {mentorUser?.name?.charAt(0)}
            </div>
            <h6 className="fw-semibold mb-1 text-truncate" style={{fontSize: '0.9rem'}}>{name || 'Mentor'}</h6>
            <span className="badge bg-success-subtle text-success small">Urban Expert</span>
          </div>

          <ul className="nav flex-column flex-grow-1">
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <i className="bi bi-speedometer2"></i>Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'mentees' ? 'active' : ''}`} onClick={() => setActiveTab('mentees')}>
                <i className="bi bi-people"></i>My Mentees
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'availability' ? 'active' : ''}`} onClick={() => setActiveTab('availability')}>
                <i className="bi bi-calendar-event"></i>Availability Slots
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>
                <i className="bi bi-cloud-arrow-up-fill"></i>Share Materials
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                <i className="bi bi-star"></i>Mentees Feedback
              </button>
            </li>
            <li className="nav-item mt-3 px-2">
              <Link to="/messages" className="btn btn-outline-success btn-sm w-100 rounded-3">
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
            <i className="bi bi-rocket-takeoff-fill text-success fs-4 me-2"></i>
            <span style={{ fontSize: '1.2rem' }}>MentorConnect</span>
          </Link>
          <button className="btn btn-outline-secondary btn-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar">
            <i className="bi bi-list fs-4"></i>
          </button>
        </div>

        {/* Mobile Sidebar Offcanvas */}
        <div className="offcanvas offcanvas-start d-md-none" tabIndex="-1" id="mobileSidebar" style={{ maxWidth: 280 }}>
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title fw-bold" id="mobileSidebarLabel">Mentor Menu</h5>
            <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body sidebar p-3">
            <div className="sidebar-profile text-center mb-3">
              <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2 fw-bold" style={{width: 45, height: 45, fontSize: '1.2rem'}}>
                {mentorUser?.name?.charAt(0)}
              </div>
              <h6 className="fw-semibold mb-1 text-truncate" style={{fontSize: '0.9rem'}}>{name || 'Mentor'}</h6>
              <span className="badge bg-success-subtle text-success small">Urban Expert</span>
            </div>

            <ul className="nav flex-column flex-grow-1">
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'dashboard' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('dashboard')}>
                  <i className="bi bi-speedometer2"></i>Dashboard
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'mentees' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('mentees')}>
                  <i className="bi bi-people"></i>My Mentees
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'availability' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('availability')}>
                  <i className="bi bi-calendar-event"></i>Availability Slots
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'resources' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('resources')}>
                  <i className="bi bi-cloud-arrow-up-fill"></i>Share Materials
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'reviews' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('reviews')}>
                  <i className="bi bi-star"></i>Mentees Feedback
                </button>
              </li>
              <li className="nav-item mt-3 px-2">
                <Link to="/messages" className="btn btn-outline-success btn-sm w-100 rounded-3">
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

        {/* Main Content Area */}
        <main className="col-md-9 col-lg-10 p-4" style={{minHeight: '100vh', background: '#f8fafc'}}>
          
          {/* Header */}
          <header className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="text-muted small">Corporate Social Mentorship</span>
              <h4 className="fw-bold mb-0">Mentor Hub Panel</h4>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <i className="bi bi-bell text-muted fs-5 cursor-pointer"></i>
                {pendingCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">New requests</span>
                  </span>
                )}
              </div>
              <div className="d-flex align-items-center gap-2 ps-3 border-start">
                <i className="bi bi-circle-fill text-success small"></i>
                <span className="small fw-semibold">Mentor Account</span>
              </div>
            </div>
          </header>

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Stats upper grid */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="widget-card card-box border-start border-primary border-4 p-3 bg-white h-100">
                    <h6 className="text-muted small fw-semibold">Active Mentees assigned</h6>
                    <div className="mt-2">
                      <h3 className="fw-bold text-primary mb-0">{assignedMentees.length} Students</h3>
                      <p className="text-muted small mb-0 mt-1">Guiding rural students seeking guidance.</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="widget-card success card-box border-start border-success border-4 p-3 bg-white h-100">
                    <h6 className="text-muted small fw-semibold">Next Session Call</h6>
                    {upcomingSession ? (
                      <div className="mt-2">
                        <h6 className="fw-bold text-success mb-1">{upcomingSession.title}</h6>
                        <small className="text-muted d-block">Student: {upcomingSession.menteeName}</small>
                        <small className="fw-semibold text-dark">{upcomingSession.date} at {upcomingSession.time}</small>
                        <div className="mt-2">
                          <Link to={`/video-call/${upcomingSession.id}`} className="btn btn-xs btn-success text-white py-1 px-2 rounded small fw-semibold">Launch Call Room</Link>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-muted small">No upcoming sessions confirmed. Check requests tab below to schedule.</div>
                    )}
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="widget-card warning card-box border-start border-warning border-4 p-3 bg-white h-100">
                    <h6 className="text-muted small fw-semibold">Average Student Score</h6>
                    <div className="mt-2">
                      <h3 className="fw-bold text-warning mb-0">
                        {reviewsList.length > 0 ? (reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewsList.length).toFixed(1) : '5.0'} ★
                      </h3>
                      <p className="text-muted small mb-0 mt-1">Based on {reviewsList.length} feedback reviews.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Section: Pending Session Requests */}
              <div className="card-box bg-white">
                <h5 className="fw-bold mb-3">Pending Call Requests</h5>
                {dataLoading ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                ) : mySessions.filter(s => s.status === 'pending').length === 0 ? (
                  <div className="text-center py-4 text-muted small">No pending meeting requests from mentees.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Mentee</th>
                          <th>Topic</th>
                          <th>Suggested Slot</th>
                          <th className="text-end">Decisions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mySessions.filter(s => s.status === 'pending').map(s => (
                          <tr key={s.id}>
                            <td>
                              <span className="fw-semibold">{s.menteeName}</span>
                              <div className="text-muted small">{s.menteeEmail}</div>
                            </td>
                            <td>{s.title}</td>
                            <td>
                              <strong>{s.date}</strong> at <span className="text-muted">{s.time}</span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-1">
                                <button className="btn btn-sm btn-success" onClick={() => handleApproveSession(s.id, 'approved')}>Accept</button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleApproveSession(s.id, 'cancelled')}>Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: MY MENTEES */}
          {activeTab === 'mentees' && (
            <div className="card-box bg-white">
              <h5 className="fw-bold mb-4">Assigned Students Mentorship</h5>
              {dataLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : assignedMentees.length === 0 ? (
                <div className="text-center py-5 text-muted small">No students assigned to you yet. Admin will review matching shortly.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Profile / Bio Details</th>
                        <th className="text-end">Options</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedMentees.map(m => (
                        <tr key={m.uid}>
                          <td>
                            <div className="fw-bold">{m.name}</div>
                          </td>
                          <td>{m.email}</td>
                          <td>
                            <span className="small text-muted">{m.bio || 'No bio documented.'}</span>
                          </td>
                          <td className="text-end">
                            <Link to="/messages" className="btn btn-sm btn-outline-success">
                              <i className="bi bi-chat-dots-fill"></i> Message
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: AVAILABILITY SLOTS */}
          {activeTab === 'availability' && (
            <div className="row g-4">
              <div className="col-md-5">
                <div className="card-box bg-white">
                  <h5 className="fw-bold mb-3">Add Available Hours</h5>
                  <form onSubmit={handleAddSlot}>
                    <div className="mb-3">
                      <label className="form-label">Day of Week</label>
                      <select className="form-select" value={newDay} onChange={e => setNewDay(e.target.value)}>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Start Time</label>
                      <input className="form-control" type="time" value={newTime} onChange={e => setNewTime(e.target.value)} required />
                    </div>

                    <button className="btn btn-success btn-sm" type="submit">Publish Available Slot</button>
                  </form>
                </div>
              </div>

              <div className="col-md-7">
                <div className="card-box bg-white h-100">
                  <h5 className="fw-bold mb-3">Current Published Slots</h5>
                  {slots.length === 0 ? (
                    <div className="text-center py-5 text-muted small">No slots published. Mentees will not be able to auto-book call slots.</div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {slots.map((s, idx) => (
                        <div key={idx} className="list-group-item px-0 py-3 border-bottom d-flex justify-content-between align-items-center">
                          <span className="fw-medium text-dark"><i className="bi bi-clock me-2 text-success"></i>{s}</span>
                          <button className="btn btn-sm btn-link text-danger p-0" title="Remove" onClick={() => handleRemoveSlot(s)}>
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SHARE RESOURCES */}
          {activeTab === 'resources' && (
            <div className="row g-4">
              <div className="col-md-5">
                <div className="card-box bg-white">
                  <h5 className="fw-bold mb-3">Publish Study Materials</h5>
                  {resSuccess && <div className="alert alert-info py-2 small">{resSuccess}</div>}
                  
                  <form onSubmit={handleUploadResource}>
                    <div className="mb-3">
                      <label className="form-label">Resource Title</label>
                      <input className="form-control" placeholder="e.g. Git Cheatsheet" value={resTitle} onChange={e => setResTitle(e.target.value)} required />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Material Type</label>
                      <select className="form-select" value={resType} onChange={e => setResType(e.target.value)}>
                        <option value="PDF Guide">PDF Guide</option>
                        <option value="Video Class">Video Class</option>
                        <option value="Useful Website">Useful Website</option>
                        <option value="Repository Link">Repository Link</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Destination Link URL</label>
                      <input className="form-control" placeholder="https://..." value={resLink} onChange={e => setResLink(e.target.value)} required />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Brief Description</label>
                      <textarea className="form-control" rows="3" placeholder="Explain what the students will learn from this..." value={resDesc} onChange={e => setResDesc(e.target.value)} />
                    </div>

                    <button className="btn btn-success btn-sm" type="submit">Share Resource</button>
                  </form>
                </div>
              </div>

              <div className="col-md-7">
                <div className="card-box bg-white h-100">
                  <h5 className="fw-bold mb-3">Shared Materials History</h5>
                  {dataLoading ? (
                    <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                  ) : myResources.length === 0 ? (
                    <div className="text-center py-5 text-muted small">No materials shared yet. Upload resources to make them visible to mentees.</div>
                  ) : (
                    <div className="list-group list-group-flush" style={{maxHeight: 400, overflowY: 'auto'}}>
                      {myResources.map(res => (
                        <div key={res.id} className="list-group-item px-0 py-3 border-bottom">
                          <div className="d-flex justify-content-between">
                            <h6 className="fw-bold mb-1 small">{res.title}</h6>
                            <span className="badge bg-success-subtle text-success small">{res.type}</span>
                          </div>
                          <p className="text-muted small mb-1">{res.description}</p>
                          <a href={res.link} target="_blank" rel="noopener noreferrer" className="small text-decoration-none text-success">Open Resource <i className="bi bi-box-arrow-up-right"></i></a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="card-box bg-white">
              <h5 className="fw-bold mb-4">Mentees Feedback & Reviews</h5>
              {dataLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : reviewsList.length === 0 ? (
                <div className="text-center py-5 text-muted small">No reviews received from mentees yet.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {reviewsList.map((f, idx) => (
                    <div key={idx} className="list-group-item px-0 py-3 border-bottom d-flex justify-content-between align-items-start">
                      <div>
                        <strong>{f.menteeName}</strong>
                        <div className="text-muted small mt-1">{f.message}</div>
                        <span className="text-muted xsmall" style={{fontSize: '0.75rem'}}>Date: {new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="badge bg-warning text-dark">{f.rating} ★</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default MentorDashboard
