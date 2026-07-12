import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore'

function AdminDashboard() {
  const { userData: adminUser, loading, logout } = useAuth()
  const navigate = useNavigate()
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('overview')
  
  // Data States
  const [mentors, setMentors] = useState([])
  const [mentees, setMentees] = useState([])
  const [sessions, setSessions] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  
  // Loading & Message States
  const [dataLoading, setDataLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')

  // Search & Filters
  const [mentorSearch, setMentorSearch] = useState('')
  const [mentorFilter, setMentorFilter] = useState('all') // all, pending, approved, rejected
  const [menteeSearch, setMenteeSearch] = useState('')

  // Modal / Detail States
  const [selectedMentor, setSelectedMentor] = useState(null)
  const [selectedMentee, setSelectedMentee] = useState(null)
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [showMenteeModal, setShowMenteeModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  
  // Form Edit States
  const [editUser, setEditUser] = useState(null) // for editing mentor/mentee
  const [showEditModal, setShowEditModal] = useState(false)

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annTarget, setAnnTarget] = useState('all')
  const [editingAnnId, setEditingAnnId] = useState(null)

  // Assign Mentor State
  const [assignMentorEmail, setAssignMentorEmail] = useState('')

  // Reschedule Session State
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  // Settings state
  const [adminName, setAdminName] = useState('')
  const [platformEmail, setPlatformEmail] = useState('support@mentorconnect.com')
  const [emailAlerts, setEmailAlerts] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!adminUser || adminUser.role !== 'admin') {
      navigate('/login')
      return
    }
    setAdminName(adminUser.name || 'Administrator')
    loadAllData()
  }, [adminUser, loading, navigate])

  const loadAllData = async () => {
    setDataLoading(true)
    try {
      // 1. Fetch Users from separate collections
      const mentorsSnap = await getDocs(collection(db, "mentors"))
      const fetchedMentors = mentorsSnap.docs.map(doc => ({ uid: doc.id, ...doc.data(), role: 'mentor' }))

      const menteesSnap = await getDocs(collection(db, "mentees"))
      const fetchedMentees = menteesSnap.docs.map(doc => ({ uid: doc.id, ...doc.data(), role: 'mentee' }))
      
      setMentors(fetchedMentors)
      setMentees(fetchedMentees)

      // 2. Fetch Sessions
      const sessionsSnap = await getDocs(collection(db, "sessions"))
      const fetchedSessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      fetchedSessions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setSessions(fetchedSessions)

      // 3. Fetch Announcements
      const annSnap = await getDocs(collection(db, "announcements"))
      const fetchedAnn = annSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      fetchedAnn.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setAnnouncements(fetchedAnn)

      // 4. Fetch Feedbacks
      const feedbackSnap = await getDocs(collection(db, "feedback"))
      const fetchedFeedback = feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setFeedbacks(fetchedFeedback)

    } catch (err) {
      console.error("Error loading admin data: ", err)
      setActionErr("Failed to connect to platform database.")
    } finally {
      setDataLoading(false)
    }
  }

  // Flash messages helper
  const triggerMsg = (msg, isErr = false) => {
    if (isErr) {
      setActionErr(msg)
      setTimeout(() => setActionErr(''), 4000)
    } else {
      setActionMsg(msg)
      setTimeout(() => setActionMsg(''), 4000)
    }
  }

  // Mentor approvals
  const handleUpdateMentorStatus = async (uid, email, newStatus) => {
    try {
      const userRef = doc(db, "mentors", uid)
      await updateDoc(userRef, { status: newStatus })
      triggerMsg(`Mentor status updated to: ${newStatus}`)
      loadAllData()
      if (selectedMentor && selectedMentor.uid === uid) {
        setSelectedMentor(prev => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      console.error(err)
      triggerMsg("Failed to update status", true)
    }
  }

  // Create or Update Announcement
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault()
    if (!annTitle.trim() || !annContent.trim()) {
      triggerMsg("Please fill in all announcement fields", true)
      return
    }

    try {
      if (editingAnnId) {
        const annRef = doc(db, "announcements", editingAnnId)
        await updateDoc(annRef, {
          title: annTitle,
          content: annContent,
          targetRole: annTarget,
          updatedAt: new Date().toISOString()
        })
        triggerMsg("Announcement updated successfully.")
      } else {
        await addDoc(collection(db, "announcements"), {
          title: annTitle,
          content: annContent,
          targetRole: annTarget,
          createdAt: new Date().toISOString()
        })
        triggerMsg("Announcement created successfully.")
      }
      setAnnTitle('')
      setAnnContent('')
      setAnnTarget('all')
      setEditingAnnId(null)
      loadAllData()
    } catch (err) {
      console.error(err)
      triggerMsg("Failed to save announcement", true)
    }
  }

  const handleEditAnnouncement = (ann) => {
    setEditingAnnId(ann.id)
    setAnnTitle(ann.title)
    setAnnContent(ann.content)
    setAnnTarget(ann.targetRole || 'all')
  }

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return
    try {
      await deleteDoc(doc(db, "announcements", id))
      triggerMsg("Announcement deleted.")
      loadAllData()
    } catch (err) {
      console.error(err)
      triggerMsg("Failed to delete announcement", true)
    }
  }

  // Assign Mentor to Mentee
  const handleAssignMentor = async () => {
    if (!selectedMentee) return
    if (!assignMentorEmail) {
      triggerMsg("Please select a mentor", true)
      return
    }

    const matchedMentor = mentors.find(m => m.email === assignMentorEmail)
    if (!matchedMentor) {
      triggerMsg("Mentor not found", true)
      return
    }

    try {
      const menteeRef = doc(db, "mentees", selectedMentee.uid)
      await updateDoc(menteeRef, {
        assignedMentorEmail: matchedMentor.email,
        assignedMentorName: matchedMentor.name
      })
      triggerMsg(`Successfully assigned ${matchedMentor.name} to ${selectedMentee.name}`)
      setShowAssignModal(false)
      loadAllData()
    } catch (err) {
      console.error(err)
      triggerMsg("Failed to assign mentor", true)
    }
  }

  // Sessions Actions
  const handleUpdateSessionStatus = async (id, status) => {
    try {
      const sessionRef = doc(db, "sessions", id)
      await updateDoc(sessionRef, { status })
      triggerMsg(`Session status updated to: ${status}`)
      loadAllData()
    } catch (err) {
      console.error(err)
      triggerMsg("Failed to update session status", true)
    }
  }

  const handleRescheduleSession = async () => {
    if (!selectedSession || !newDate || !newTime) {
      triggerMsg("Invalid date or time", true)
      return
    }
    try {
      const sessionRef = doc(db, "sessions", selectedSession.id)
      await updateDoc(sessionRef, {
        date: newDate,
        time: newTime,
        status: 'pending' // reset to pending after reschedule
      })
      triggerMsg("Session rescheduled successfully.")
      setShowRescheduleModal(false)
      loadAllData()
    } catch (err) {
      console.error(err)
      triggerMsg("Failed to reschedule session", true)
    }
  }

  // User Actions (Edit/Delete Users)
  const handleSaveUserEdit = async (e) => {
    e.preventDefault()
    if (!editUser) return
    try {
      const collectionName = editUser.role === 'mentor' ? 'mentors' : 'mentees'
      const userRef = doc(db, collectionName, editUser.uid)
      await updateDoc(userRef, {
        name: editUser.name,
        bio: editUser.bio || '',
        skills: editUser.skills || ''
      })
      triggerMsg(`User details for ${editUser.name} updated.`)
      setShowEditModal(false)
      setEditUser(null)
      loadAllData()
    } catch (err) {
      console.error(err)
      triggerMsg("Failed to update user details", true)
    }
  }

  const handleDeleteUser = async (uid, name, role) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action is irreversible.`)) return
    try {
      const collectionName = role === 'mentor' ? 'mentors' : 'mentees'
      await deleteDoc(doc(db, collectionName, uid))
      triggerMsg(`Deleted user: ${name}`)
      loadAllData()
    } catch (err) {
      console.error(err)
      triggerMsg("Failed to delete user", true)
    }
  }

  // Settings Save
  const handleSaveSettings = (e) => {
    e.preventDefault()
    triggerMsg("Platform settings saved successfully.")
  }

  // Filter lists
  const filteredMentors = mentors.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(mentorSearch.toLowerCase()) || 
                          m.email.toLowerCase().includes(mentorSearch.toLowerCase())
    
    const mStatus = m.status || 'approved' // default to approved if not set
    const matchesStatus = mentorFilter === 'all' || mStatus === mentorFilter
    return matchesSearch && matchesStatus
  })

  const filteredMentees = mentees.filter(m => {
    return m.name.toLowerCase().includes(menteeSearch.toLowerCase()) || 
           m.email.toLowerCase().includes(menteeSearch.toLowerCase())
  })

  // Counters
  const activeSessionsCount = sessions.filter(s => s.status === 'approved').length
  const pendingMentorsCount = mentors.filter(m => m.status === 'pending').length

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Desktop Sidebar (hidden on mobile) */}
        <aside className="col-md-3 col-lg-2 sidebar d-none d-md-flex">
          <div className="sidebar-header d-flex align-items-center">
            <i className="bi bi-shield-lock-fill text-primary fs-3 me-2"></i>
            <h5 className="fw-bold mb-0">Admin ERP</h5>
          </div>
          
          <div className="sidebar-profile text-center">
            <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: 45, height: 45}}>
              <i className="bi bi-person-workspace fs-4"></i>
            </div>
            <h6 className="fw-semibold mb-1 text-truncate" style={{fontSize: '0.9rem'}}>{adminName}</h6>
            <span className="badge bg-secondary-subtle text-secondary small">Administrator</span>
          </div>

          <nav className="nav flex-column flex-grow-1">
            <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <i className="bi bi-grid-1x2-fill"></i>Overview
            </button>
            <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'mentors' ? 'active' : ''}`} onClick={() => setActiveTab('mentors')}>
              <i className="bi bi-person-badge-fill"></i>Mentors {pendingMentorsCount > 0 && <span className="badge bg-warning text-dark ms-auto">{pendingMentorsCount}</span>}
            </button>
            <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'mentees' ? 'active' : ''}`} onClick={() => setActiveTab('mentees')}>
              <i className="bi bi-people-fill"></i>Mentees
            </button>
            <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'sessions' ? 'active' : ''}`} onClick={() => setActiveTab('sessions')}>
              <i className="bi bi-calendar-event-fill"></i>Sessions
            </button>
            <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
              <i className="bi bi-megaphone-fill"></i>Announcements
            </button>
            <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              <i className="bi bi-gear-fill"></i>Settings
            </button>
            
            <div className="sidebar-divider"></div>
            
            <button className="nav-link border-0 text-start bg-transparent text-danger w-100" onClick={logout}>
              <i className="bi bi-box-arrow-right"></i>Logout
            </button>
          </nav>
        </aside>

        {/* Mobile Header (visible on mobile only) */}
        <div className="d-flex d-md-none justify-content-between align-items-center p-3 bg-white border-bottom shadow-sm w-100">
          <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
            <i className="bi bi-rocket-takeoff-fill text-primary fs-4 me-2"></i>
            <span style={{ fontSize: '1.2rem' }}>MentorConnect</span>
          </Link>
          <button className="btn btn-outline-secondary btn-sm" type="button" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar">
            <i className="bi bi-list fs-4"></i>
          </button>
        </div>

        {/* Mobile Sidebar Offcanvas */}
        <div className="offcanvas offcanvas-start d-md-none" tabIndex="-1" id="mobileSidebar" style={{ maxWidth: 280 }}>
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title fw-bold" id="mobileSidebarLabel">Admin ERP Menu</h5>
            <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body sidebar p-3">
            <div className="sidebar-profile text-center mb-3">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{width: 45, height: 45}}>
                <i className="bi bi-person-workspace fs-4"></i>
              </div>
              <h6 className="fw-semibold mb-1 text-truncate" style={{fontSize: '0.9rem'}}>{adminName}</h6>
              <span className="badge bg-secondary-subtle text-secondary small">Administrator</span>
            </div>

            <nav className="nav flex-column flex-grow-1">
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'overview' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('overview')}>
                <i className="bi bi-grid-1x2-fill"></i>Overview
              </button>
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'mentors' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('mentors')}>
                <i className="bi bi-person-badge-fill"></i>Mentors {pendingMentorsCount > 0 && <span className="badge bg-warning text-dark ms-auto">{pendingMentorsCount}</span>}
              </button>
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'mentees' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('mentees')}>
                <i className="bi bi-people-fill"></i>Mentees
              </button>
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'sessions' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('sessions')}>
                <i className="bi bi-calendar-event-fill"></i>Sessions
              </button>
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'announcements' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('announcements')}>
                <i className="bi bi-megaphone-fill"></i>Announcements
              </button>
              <button className={`nav-link border-0 text-start bg-transparent w-100 ${activeTab === 'settings' ? 'active' : ''}`} data-bs-dismiss="offcanvas" onClick={() => setActiveTab('settings')}>
                <i className="bi bi-gear-fill"></i>Settings
              </button>
              
              <div className="sidebar-divider"></div>
              
              <button className="nav-link border-0 text-start bg-transparent text-danger w-100" data-bs-dismiss="offcanvas" onClick={logout}>
                <i className="bi bi-box-arrow-right"></i>Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="col-md-9 col-lg-10 p-4" style={{minHeight: '100vh', background: '#f8fafc'}}>
          
          {/* Header */}
          <header className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="text-muted small">Welcome Back</span>
              <h3 className="fw-bold mb-0">Platform Administration</h3>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <i className="bi bi-bell-fill fs-5 text-muted cursor-pointer"></i>
                {pendingMentorsCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
                )}
              </div>
              
              <div className="d-flex align-items-center gap-2 ps-3 border-start">
                <i className="bi bi-circle-fill text-success small"></i>
                <span className="small fw-medium d-none d-sm-inline">System Online</span>
              </div>
            </div>
          </header>

          {/* Flash Messages */}
          {actionMsg && (
            <div className="alert alert-success d-flex align-items-center py-2 px-3 rounded-3 shadow-sm animate__animated animate__fadeIn" role="alert">
              <i className="bi bi-check-circle-fill me-2 fs-5"></i>
              <div>{actionMsg}</div>
            </div>
          )}

          {actionErr && (
            <div className="alert alert-danger d-flex align-items-center py-2 px-3 rounded-3 shadow-sm animate__animated animate__fadeIn" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div>{actionErr}</div>
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* Widgets Grid */}
              <div className="row g-3 mb-4">
                <div className="col-sm-6 col-xl-3">
                  <div className="widget-card card-box border-start border-primary border-4 p-3 bg-white h-100">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-semibold uppercase">Total Mentors</span>
                        <h2 className="fw-bold mt-1 mb-0">{mentors.length}</h2>
                      </div>
                      <div className="widget-icon icon-primary">
                        <i className="bi bi-person-badge"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                  <div className="widget-card success card-box border-start border-success border-4 p-3 bg-white h-100">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-semibold uppercase">Total Mentees</span>
                        <h2 className="fw-bold mt-1 mb-0">{mentees.length}</h2>
                      </div>
                      <div className="widget-icon icon-success">
                        <i className="bi bi-people"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                  <div className="widget-card warning card-box border-start border-warning border-4 p-3 bg-white h-100">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-semibold uppercase">Active Sessions</span>
                        <h2 className="fw-bold mt-1 mb-0">{activeSessionsCount}</h2>
                      </div>
                      <div className="widget-icon icon-warning">
                        <i className="bi bi-calendar2-check"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-sm-6 col-xl-3">
                  <div className="widget-card danger card-box border-start border-danger border-4 p-3 bg-white h-100">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="text-muted small fw-semibold uppercase">Feedback Reviews</span>
                        <h2 className="fw-bold mt-1 mb-0">{feedbacks.length}</h2>
                      </div>
                      <div className="widget-icon icon-danger">
                        <i className="bi bi-chat-heart"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Grid: Recent activity, announcements, pending approvals */}
              <div className="row g-4">
                
                {/* Pending Approvals Widget */}
                <div className="col-lg-6">
                  <div className="card-box bg-white h-100">
                    <h5 className="fw-bold mb-3 d-flex justify-content-between">
                      <span>Pending Mentor Requests</span>
                      <span className="badge bg-warning text-dark fs-6">{pendingMentorsCount}</span>
                    </h5>
                    {dataLoading ? (
                      <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                    ) : mentors.filter(m => m.status === 'pending').length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <i className="bi bi-check-all text-success fs-1"></i>
                        <p className="mb-0 mt-2 small">All mentors have been approved!</p>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {mentors.filter(m => m.status === 'pending').map(m => (
                          <div key={m.uid} className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom">
                            <div>
                              <h6 className="mb-0 fw-semibold">{m.name}</h6>
                              <small className="text-muted">{m.email}</small>
                            </div>
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-success" onClick={() => handleUpdateMentorStatus(m.uid, m.email, 'approved')}>Approve</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleUpdateMentorStatus(m.uid, m.email, 'rejected')}>Reject</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Activity Feed */}
                <div className="col-lg-6">
                  <div className="card-box bg-white h-100">
                    <h5 className="fw-bold mb-3">Recent Booking Bookings</h5>
                    {dataLoading ? (
                      <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <p className="small mb-0">No sessions booked yet on the platform.</p>
                      </div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {sessions.slice(0, 4).map(s => (
                          <div key={s.id} className="list-group-item px-0 py-3 border-bottom d-flex align-items-start gap-3">
                            <div className="bg-primary-subtle text-primary rounded p-2" style={{fontSize:'1.1rem'}}>
                              <i className="bi bi-calendar-check-fill"></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <strong className="small">{s.title || "Career Session"}</strong>
                                <span className={`badge ${s.status === 'approved' ? 'bg-success' : s.status === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark'} small`}>
                                  {s.status}
                                </span>
                              </div>
                              <p className="text-muted mb-0 small mt-1">
                                Mentee: <strong>{s.menteeName}</strong> guided by Mentor: <strong>{s.mentorName}</strong>
                              </p>
                              <span className="text-muted xsmall" style={{fontSize: '0.75rem'}}>Date: {s.date} at {s.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: MENTORS */}
          {activeTab === 'mentors' && (
            <div className="card-box bg-white">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
                <h5 className="fw-bold mb-0">Mentor Directory</h5>
                
                <div className="d-flex flex-wrap gap-2 w-100 w-sm-auto">
                  <div className="input-group input-group-sm" style={{maxWidth: 240}}>
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <input type="text" className="form-control" placeholder="Search Mentors..." value={mentorSearch} onChange={e => setMentorSearch(e.target.value)} />
                  </div>
                  
                  <select className="form-select form-select-sm" style={{maxWidth: 150}} value={mentorFilter} onChange={e => setMentorFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {dataLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : filteredMentors.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-people fs-1"></i>
                  <p className="mt-2 mb-0 small">No mentors found matching requirements.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Skills</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMentors.map(m => (
                        <tr key={m.uid}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width: 32, height: 32}}>
                                {m.name?.charAt(0)}
                              </div>
                              <span className="fw-semibold">{m.name}</span>
                            </div>
                          </td>
                          <td>{m.email}</td>
                          <td>
                            {m.skills ? m.skills.split(',').map((s, idx) => (
                              <span key={idx} className="badge bg-secondary-subtle text-secondary me-1 small">{s.trim()}</span>
                            )) : <span className="text-muted small">None added</span>}
                          </td>
                          <td>
                            <span className={`badge ${m.status === 'approved' ? 'bg-success' : m.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                              {m.status || 'approved'}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <button className="btn btn-sm btn-outline-primary" onClick={() => { setSelectedMentor(m); setShowMentorModal(true); }}>
                                <i className="bi bi-eye"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditUser(m); setShowEditModal(true); }}>
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(m.uid, m.name, 'mentor')}>
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: MENTEES */}
          {activeTab === 'mentees' && (
            <div className="card-box bg-white">
              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
                <h5 className="fw-bold mb-0">Mentee Directory</h5>
                
                <div className="input-group input-group-sm" style={{maxWidth: 240}}>
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <input type="text" className="form-control" placeholder="Search Mentees..." value={menteeSearch} onChange={e => setMenteeSearch(e.target.value)} />
                </div>
              </div>

              {dataLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : filteredMentees.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-people fs-1"></i>
                  <p className="mt-2 mb-0 small">No mentees registered yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Assigned Mentor</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMentees.map(m => (
                        <tr key={m.uid}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width: 32, height: 32}}>
                                {m.name?.charAt(0)}
                              </div>
                              <span className="fw-semibold">{m.name}</span>
                            </div>
                          </td>
                          <td>{m.email}</td>
                          <td>
                            {m.assignedMentorName ? (
                              <div className="d-flex align-items-center gap-1">
                                <span className="fw-medium text-success">{m.assignedMentorName}</span>
                                <span className="text-muted small">({m.assignedMentorEmail})</span>
                              </div>
                            ) : (
                              <span className="text-danger small fw-semibold">Unassigned</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <button className="btn btn-sm btn-outline-info" title="Assign Mentor" onClick={() => { setSelectedMentee(m); setAssignMentorEmail(m.assignedMentorEmail || ''); setShowAssignModal(true); }}>
                                <i className="bi bi-person-plus-fill"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-primary" onClick={() => { setSelectedMentee(m); setShowMenteeModal(true); }}>
                                <i className="bi bi-eye"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditUser(m); setShowEditModal(true); }}>
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(m.uid, m.name, 'mentee')}>
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="card-box bg-white">
              <h5 className="fw-bold mb-4">Platform Session Management</h5>

              {dataLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-calendar-x fs-1"></i>
                  <p className="mt-2 mb-0 small">No sessions booked on the platform yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Topic</th>
                        <th>Mentor</th>
                        <th>Mentee</th>
                        <th>Scheduled For</th>
                        <th>Status</th>
                        <th className="text-end">Controls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(s => (
                        <tr key={s.id}>
                          <td><span className="fw-semibold">{s.title || "Mentoring Session"}</span></td>
                          <td>{s.mentorName || s.mentorEmail}</td>
                          <td>{s.menteeName || s.menteeEmail}</td>
                          <td>
                            <div className="small fw-semibold">{s.date}</div>
                            <div className="text-muted small">{s.time}</div>
                          </td>
                          <td>
                            <span className={`badge ${s.status === 'approved' ? 'bg-success' : s.status === 'cancelled' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              {s.status === 'pending' && (
                                <button className="btn btn-sm btn-success" title="Approve" onClick={() => handleUpdateSessionStatus(s.id, 'approved')}>
                                  <i className="bi bi-check-lg"></i>
                                </button>
                              )}
                              {s.status !== 'cancelled' && (
                                <>
                                  <button className="btn btn-sm btn-outline-warning text-dark" title="Reschedule" onClick={() => { setSelectedSession(s); setNewDate(s.date); setNewTime(s.time); setShowRescheduleModal(true); }}>
                                    <i className="bi bi-clock-history"></i>
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger" title="Cancel Session" onClick={() => handleUpdateSessionStatus(s.id, 'cancelled')}>
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="row g-4">
              {/* Form Side */}
              <div className="col-md-5">
                <div className="card-box bg-white">
                  <h5 className="fw-bold mb-3">{editingAnnId ? "Edit Announcement" : "Publish Announcement"}</h5>
                  <form onSubmit={handleSaveAnnouncement}>
                    <div className="mb-3">
                      <label className="form-label">Announcement Title</label>
                      <input type="text" className="form-control" placeholder="e.g. Skill Assessment Test" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Target Audience</label>
                      <select className="form-select" value={annTarget} onChange={e => setAnnTarget(e.target.value)}>
                        <option value="all">Everyone</option>
                        <option value="mentor">Mentors Only</option>
                        <option value="mentee">Mentees Only</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Content Message</label>
                      <textarea className="form-control" rows="4" placeholder="Detail description or platform update..." value={annContent} onChange={e => setAnnContent(e.target.value)} required></textarea>
                    </div>

                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-sm btn-primary">
                        {editingAnnId ? "Update" : "Publish"}
                      </button>
                      {editingAnnId && (
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => { setEditingAnnId(null); setAnnTitle(''); setAnnContent(''); }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Announcements List Side */}
              <div className="col-md-7">
                <div className="card-box bg-white h-100">
                  <h5 className="fw-bold mb-3">Announcement Log</h5>
                  {dataLoading ? (
                    <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
                  ) : announcements.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <p className="small mb-0">No announcements have been published.</p>
                    </div>
                  ) : (
                    <div className="list-group list-group-flush" style={{maxHeight: 480, overflowY: 'auto'}}>
                      {announcements.map(ann => (
                        <div key={ann.id} className="list-group-item px-0 py-3 border-bottom">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1 fw-bold">{ann.title}</h6>
                              <span className="badge bg-secondary-subtle text-secondary me-2 small">Target: {ann.targetRole}</span>
                              <span className="text-muted xsmall" style={{fontSize: '0.75rem'}}>{new Date(ann.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-link text-primary p-0" title="Edit" onClick={() => handleEditAnnouncement(ann)}><i className="bi bi-pencil-fill"></i></button>
                              <button className="btn btn-sm btn-link text-danger p-0" title="Delete" onClick={() => handleDeleteAnnouncement(ann.id)}><i className="bi bi-trash-fill"></i></button>
                            </div>
                          </div>
                          <p className="text-muted mt-2 mb-0 small" style={{whiteSpace: 'pre-wrap'}}>{ann.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="card-box bg-white" style={{maxWidth: 680}}>
              <h5 className="fw-bold mb-4">Platform Settings</h5>
              <form onSubmit={handleSaveSettings}>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Admin User Name</label>
                    <input className="form-control" value={adminName} onChange={e => setAdminName(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Platform Support Email</label>
                    <input className="form-control" type="email" value={platformEmail} onChange={e => setPlatformEmail(e.target.value)} required />
                  </div>
                  
                  <div className="col-12 mt-4">
                    <div className="form-check form-switch mb-2">
                      <input className="form-check-input" type="checkbox" id="emailAlertsCheck" checked={emailAlerts} onChange={e => setEmailAlerts(e.target.checked)} />
                      <label className="form-check-label fw-medium" htmlFor="emailAlertsCheck">System Email Alerts</label>
                      <p className="text-muted small mb-0">Automatically notify admin when a new mentor signs up or books a session.</p>
                    </div>
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <button type="submit" className="btn btn-primary">Save Config</button>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* DETAIL MODAL: MENTOR */}
      {showMentorModal && selectedMentor && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Mentor Account Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowMentorModal(false)}></button>
              </div>
              <div className="modal-body py-0">
                <div className="text-center mb-3">
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold fs-2" style={{width: 60, height: 60}}>
                    {selectedMentor.name?.charAt(0)}
                  </div>
                  <h5 className="fw-bold mt-2 mb-0">{selectedMentor.name}</h5>
                  <span className="text-muted small">{selectedMentor.email}</span>
                </div>
                <div className="card p-3 border-0 bg-light rounded-3 mb-3">
                  <div className="mb-2"><strong>Bio:</strong> <span className="text-muted small">{selectedMentor.bio || 'No profile biography yet.'}</span></div>
                  <div><strong>Skills Listed:</strong> <span className="text-muted small">{selectedMentor.skills || 'None Added.'}</span></div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Platform Status:</span>
                  <span className={`badge ${selectedMentor.status === 'approved' ? 'bg-success' : selectedMentor.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                    {selectedMentor.status || 'approved'}
                  </span>
                </div>
              </div>
              <div className="modal-footer border-top-0 gap-2">
                <button className="btn btn-sm btn-success" onClick={() => handleUpdateMentorStatus(selectedMentor.uid, selectedMentor.email, 'approved')}>Approve Mentor</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleUpdateMentorStatus(selectedMentor.uid, selectedMentor.email, 'rejected')}>Reject</button>
                <button className="btn btn-sm btn-secondary" onClick={() => setShowMentorModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: MENTEE */}
      {showMenteeModal && selectedMentee && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Mentee Information</h5>
                <button type="button" className="btn-close" onClick={() => setShowMenteeModal(false)}></button>
              </div>
              <div className="modal-body py-0">
                <div className="text-center mb-3">
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center fw-bold fs-2" style={{width: 60, height: 60}}>
                    {selectedMentee.name?.charAt(0)}
                  </div>
                  <h5 className="fw-bold mt-2 mb-0">{selectedMentee.name}</h5>
                  <span className="text-muted small">{selectedMentee.email}</span>
                </div>
                <div className="card p-3 border-0 bg-light rounded-3">
                  <div className="mb-2"><strong>Assigned Mentor:</strong> <span className="text-muted small">{selectedMentee.assignedMentorName || 'Unassigned'}</span></div>
                  {selectedMentee.assignedMentorEmail && <div><strong>Mentor Email:</strong> <span className="text-muted small">{selectedMentee.assignedMentorEmail}</span></div>}
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button className="btn btn-sm btn-secondary" onClick={() => setShowMenteeModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (GENERAL USER) */}
      {showEditModal && editUser && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Edit Profile Details</h5>
                <button type="button" className="btn-close" onClick={() => { setShowEditModal(false); setEditUser(null); }}></button>
              </div>
              <form onSubmit={handleSaveUserEdit}>
                <div className="modal-body py-0">
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input className="form-control" value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Bio Details</label>
                    <textarea className="form-control" rows="3" value={editUser.bio || ''} onChange={e => setEditUser({...editUser, bio: e.target.value})}></textarea>
                  </div>
                  {editUser.role === 'mentor' && (
                    <div className="mb-3">
                      <label className="form-label">Skills (comma separated)</label>
                      <input className="form-control" value={editUser.skills || ''} onChange={e => setEditUser({...editUser, skills: e.target.value})} placeholder="e.g. React, UI/UX Design, Strategy" />
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top-0">
                  <button type="submit" className="btn btn-sm btn-primary">Save Changes</button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => { setShowEditModal(false); setEditUser(null); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MENTOR MODAL */}
      {showAssignModal && selectedMentee && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Assign Mentor to Student</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
              </div>
              <div className="modal-body py-0">
                <p className="small text-muted">Select an approved urban professional mentor to guide <strong>{selectedMentee.name}</strong>.</p>
                <div className="mb-3">
                  <label className="form-label">Available Mentors</label>
                  <select className="form-select" value={assignMentorEmail} onChange={e => setAssignMentorEmail(e.target.value)}>
                    <option value="">-- Choose Approved Mentor --</option>
                    {mentors.filter(m => m.status === 'approved' || !m.status).map(m => (
                      <option key={m.uid} value={m.email}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button className="btn btn-sm btn-primary" onClick={handleAssignMentor}>Save Assignment</button>
                <button className="btn btn-sm btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && selectedSession && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Reschedule Session</h5>
                <button type="button" className="btn-close" onClick={() => setShowRescheduleModal(false)}></button>
              </div>
              <div className="modal-body py-0">
                <div className="mb-3">
                  <label className="form-label">New Meeting Date</label>
                  <input type="date" className="form-control" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Meeting Time</label>
                  <input type="time" className="form-control" value={newTime} onChange={e => setNewTime(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer border-top-0">
                <button className="btn btn-sm btn-primary" onClick={handleRescheduleSession}>Reschedule</button>
                <button className="btn btn-sm btn-secondary" onClick={() => setShowRescheduleModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminDashboard
