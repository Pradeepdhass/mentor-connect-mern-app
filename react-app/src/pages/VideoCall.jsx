import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { db } from '../firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

function VideoCall() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { userData: user, loading } = useAuth()
  
  // Media States
  const [localStream, setLocalStream] = useState(null)
  const [micActive, setMicActive] = useState(true)
  const [camActive, setCamActive] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const localVideoRef = useRef(null)

  // DB Data States
  const [sessionData, setSessionData] = useState(null)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesMsg, setNotesMsg] = useState('All changes saved.')

  // Chat States
  const [callMessages, setCallMessages] = useState([
    { sender: 'System', text: 'Welcome to the secure mentorship video session.', time: 'Just now' },
    { sender: 'Assistant', text: 'You can use the panel below to document milestones.', time: 'Just now' }
  ])
  const [newMsg, setNewMsg] = useState('')
  
  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login')
      return
    }

    // Attempt to access webcam
    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (err) {
        console.warn("Could not access camera/microphone:", err)
      }
    }
    startCam()

    // Fetch session details
    const fetchSession = async () => {
      if (!sessionId) return
      try {
        const docRef = doc(db, "sessions", sessionId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setSessionData(data)
          setNotes(data.notes || '')
        }
      } catch (err) {
        console.error("Error loading session:", err)
      }
    }
    fetchSession()

    return () => {
      // Clean up local camera stream when leaving call
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [sessionId, user, loading, navigate])

  // Toggle Mute Audio
  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !micActive
      })
    }
    setMicActive(!micActive)
  }

  // Toggle Camera
  const handleToggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !camActive
      })
    }
    setCamActive(!camActive)
  }

  // Mock Screen Share
  const handleToggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        setScreenSharing(true)
        stream.getVideoTracks()[0].onended = () => {
          stopScreenSharing()
        }
      } catch (err) {
        console.warn(err)
      }
    } else {
      stopScreenSharing()
    }
  }

  const stopScreenSharing = () => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
    setScreenSharing(false)
  }

  // Save notes to Firestore
  const handleNotesChange = (e) => {
    const text = e.target.value
    setNotes(text)
    setNotesMsg('Saving notes...')
  }

  useEffect(() => {
    if (!sessionId || notes === '') return
    const delayDebounce = setTimeout(async () => {
      setSavingNotes(true)
      try {
        const docRef = doc(db, "sessions", sessionId)
        await updateDoc(docRef, { notes })
        setNotesMsg('✅ Saved to database.')
      } catch (err) {
        console.error(err)
        setNotesMsg('❌ Failed to auto-save notes.')
      } finally {
        setSavingNotes(false)
      }
    }, 1500) // debounce 1.5 seconds

    return () => clearTimeout(delayDebounce)
  }, [notes, sessionId])

  // Chat send
  const handleSendCallMsg = (e) => {
    e.preventDefault()
    if (!newMsg.trim()) return
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setCallMessages(prev => [...prev, {
      sender: user.name || 'You',
      text: newMsg,
      time: timestamp
    }])
    setNewMsg('')
  }

  const handleLeaveCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    // Redirect back to dashboard based on role
    if (user?.role === 'mentor') {
      window.location.hash = '#/mentor-dashboard'
    } else if (user?.role === 'admin') {
      window.location.hash = '#/admin-dashboard'
    } else {
      window.location.hash = '#/mentee-dashboard'
    }
  }

  return (
    <div className="bg-dark text-white min-vh-100 p-3 p-md-4 d-flex flex-column">
      
      {/* Top Header */}
      <header className="d-flex justify-content-between align-items-center mb-3 mb-md-4 border-bottom border-secondary pb-3">
        <div>
          <span className="badge bg-danger mb-1 animate__animated animate__pulse animate__infinite">LIVE SESSION</span>
          <h4 className="fw-bold mb-0 text-white">
            {sessionData?.title || "Active Mentorship Connection"}
          </h4>
          <span className="text-muted small">
            Connecting: Mentor <strong>{sessionData?.mentorName}</strong> & Mentee <strong>{sessionData?.menteeName}</strong>
          </span>
        </div>
        
        <button className="btn btn-danger btn-sm rounded-3 px-3" onClick={handleLeaveCall}>
          <i className="bi bi-telephone-x-fill me-2"></i> Leave Room
        </button>
      </header>

      {/* Main Grid */}
      <div className="row g-3 flex-grow-1">
        
        {/* Left Side: Video Screens */}
        <div className="col-lg-8 d-flex flex-column justify-content-between">
          
          <div className="video-screen flex-grow-1 d-flex align-items-center justify-content-center mb-3">
            {/* Remote Feed Mock */}
            <div className="w-100 h-100 position-relative" style={{ minHeight: 400 }}>
              <div className="w-100 h-100 bg-secondary rounded-4 d-flex flex-column align-items-center justify-content-center">
                <i className="bi bi-person-video3 display-2 text-white-50"></i>
                <h5 className="mt-3 text-white-50 fw-semibold">
                  {user?.role === 'mentor' ? sessionData?.menteeName : sessionData?.mentorName}
                </h5>
                <span className="text-white-50 small">Remote participant video active</span>
              </div>
              
              {/* Local Feed webcam */}
              <div className="local-video-box">
                {camActive ? (
                  <video 
                    ref={localVideoRef} 
                    className="local-feed" 
                    autoPlay 
                    playsInline 
                    muted 
                  />
                ) : (
                  <div className="local-feed bg-dark border border-secondary d-flex align-items-center justify-content-center text-white small">
                    Camera Off
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Media Control Bar */}
          <div className="text-center py-2">
            <div className="control-bar">
              <button 
                className={`control-btn ${!micActive ? 'danger' : ''}`} 
                onClick={handleToggleMic}
                title={micActive ? "Mute Microphone" : "Unmute Microphone"}
              >
                <i className={`bi ${micActive ? 'bi-mic-fill' : 'bi-mic-mute-fill'}`}></i>
              </button>

              <button 
                className={`control-btn ${!camActive ? 'danger' : ''}`} 
                onClick={handleToggleCam}
                title={camActive ? "Turn off Camera" : "Turn on Camera"}
              >
                <i className={`bi ${camActive ? 'bi-camera-video-fill' : 'bi-camera-video-off-fill'}`}></i>
              </button>

              <button 
                className={`control-btn ${screenSharing ? 'bg-success text-white' : ''}`} 
                onClick={handleToggleScreenShare}
                title={screenSharing ? "Stop Screen Sharing" : "Share Screen"}
              >
                <i className="bi bi-display"></i>
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Chat & Notes sidebar */}
        <div className="col-lg-4 d-flex flex-column">
          <div className="row g-3 flex-grow-1">
            
            {/* Notes Section */}
            <div className="col-12 h-50">
              <div className="card bg-dark border-secondary h-100 text-white rounded-4 overflow-hidden">
                <div className="card-header border-secondary bg-transparent d-flex justify-content-between align-items-center py-2">
                  <h6 className="fw-semibold mb-0"><i className="bi bi-journal-text me-2 text-info"></i>Shared Meeting Notes</h6>
                  <span className="small text-muted">{notesMsg}</span>
                </div>
                <div className="card-body p-2 d-flex flex-column">
                  <textarea 
                    className="form-control bg-dark border-0 text-white flex-grow-1 p-2" 
                    placeholder="Document discussion points, goals set, next follow-up dates..." 
                    value={notes}
                    onChange={handleNotesChange}
                    style={{ resize: 'none', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            </div>

            {/* In-Call Chat Section */}
            <div className="col-12 h-50">
              <div className="card bg-dark border-secondary h-100 text-white rounded-4 overflow-hidden d-flex flex-column">
                <div className="card-header border-secondary bg-transparent py-2">
                  <h6 className="fw-semibold mb-0"><i className="bi bi-chat-dots-fill me-2 text-primary"></i>In-Call Messages</h6>
                </div>
                
                <div className="card-body p-3 overflow-y-auto flex-grow-1" style={{ maxHeight: 180 }}>
                  {callMessages.map((msg, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="d-flex justify-content-between">
                        <strong className="small text-info">{msg.sender}</strong>
                        <span className="text-muted" style={{fontSize: '0.75rem'}}>{msg.time}</span>
                      </div>
                      <p className="small mb-0 mt-1 text-white-50">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendCallMsg} className="p-2 border-top border-secondary bg-transparent">
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control bg-dark border-secondary text-white form-control-sm" 
                      placeholder="Type a message..." 
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm px-3" type="submit">
                      <i className="bi bi-send-fill"></i>
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

export default VideoCall
