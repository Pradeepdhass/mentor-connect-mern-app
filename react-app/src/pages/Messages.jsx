import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, getDocs, addDoc, onSnapshot } from 'firebase/firestore'

function Messages() {
  const { userData: user, loading } = useAuth()
  const navigate = useNavigate()
  
  const [contacts, setContacts] = useState([])
  const [activeContact, setActiveContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [typedMessage, setTypedMessage] = useState('')
  const [typing, setTyping] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(true)
  const messagesEndRef = useRef(null)

  // File Attachment State
  const [attachmentName, setAttachmentName] = useState('')
  const [attachmentData, setAttachmentData] = useState(null) // mock data

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login')
      return
    }
    loadContacts()
  }, [user, loading, navigate])

  const loadContacts = async () => {
    setContactsLoading(true)
    try {
      let fetchedContacts = []
      if (user.role === 'mentor') {
        // Mentor fetches assigned mentees from mentees collection
        const q = query(collection(db, "mentees"), where("assignedMentorEmail", "==", user.email))
        const snap = await getDocs(q)
        fetchedContacts = snap.docs.map(doc => ({ uid: doc.id, ...doc.data(), role: 'mentee' }))
      } else if (user.role === 'mentee') {
        // Mentee fetches assigned mentor from mentors collection
        if (user.assignedMentorEmail) {
          const q = query(collection(db, "mentors"), where("email", "==", user.assignedMentorEmail))
          const snap = await getDocs(q)
          fetchedContacts = snap.docs.map(doc => ({ uid: doc.id, ...doc.data(), role: 'mentor' }))
        } else {
          // Fetch all mentors
          const q = query(collection(db, "mentors"))
          const snap = await getDocs(q)
          fetchedContacts = snap.docs.map(doc => ({ uid: doc.id, ...doc.data(), role: 'mentor' }))
        }
      } else {
        // Admin fetches all mentors & all mentees
        const mSnap = await getDocs(collection(db, "mentors"))
        const mentorsList = mSnap.docs.map(doc => ({ uid: doc.id, ...doc.data(), role: 'mentor' }))
        
        const sSnap = await getDocs(collection(db, "mentees"))
        const menteesList = sSnap.docs.map(doc => ({ uid: doc.id, ...doc.data(), role: 'mentee' }))
        
        fetchedContacts = [...mentorsList, ...menteesList]
      }

      fetchedContacts = fetchedContacts.filter(c => c.email !== user.email) // exclude self
      setContacts(fetchedContacts)
      if (fetchedContacts.length > 0) {
        setActiveContact(fetchedContacts[0])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setContactsLoading(false)
    }
  }

  // Load chat messages between user and active contact in real-time
  useEffect(() => {
    if (!user || !activeContact) return

    const chatsRef = collection(db, "chats")
    
    // We fetch all chats, and filter in-memory since composite queries require indexes
    const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      const filtered = allMsgs.filter(m => {
        const isFromMe = m.senderEmail === user.email && m.receiverEmail === activeContact.email
        const isToMe = m.senderEmail === activeContact.email && m.receiverEmail === user.email
        return isFromMe || isToMe
      })

      // Sort by timestamp
      filtered.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
      
      setMessages(filtered)
      scrollToBottom()
    })

    return () => unsubscribe()
  }, [user, activeContact])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!typedMessage.trim() && !attachmentData) return

    const msgToSend = typedMessage
    const attachToSend = attachmentData
    const attachName = attachmentName

    setTypedMessage('')
    setAttachmentData(null)
    setAttachmentName('')

    try {
      await addDoc(collection(db, "chats"), {
        senderEmail: user.email,
        senderName: user.name,
        receiverEmail: activeContact.email,
        receiverName: activeContact.name,
        text: msgToSend,
        fileUrl: attachToSend || null,
        fileName: attachName || null,
        timestamp: new Date().toISOString()
      })
      scrollToBottom()
    } catch (err) {
      console.error(err)
    }
  }

  // Simulate typing indicator
  const handleInputChange = (e) => {
    setTypedMessage(e.target.value)
    if (!typing) {
      setTyping(true)
      setTimeout(() => setTyping(false), 2000)
    }
  }

  // Handle Mock Attachment Upload
  const handleMockAttachment = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAttachmentName(file.name)
      // Represent file upload mock visually with a simple placeholder url
      setAttachmentData("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=150&q=80")
    }
  }

  const handleBack = () => {
    if (user?.role === 'mentor') {
      window.location.hash = '#/mentor-dashboard'
    } else if (user?.role === 'admin') {
      window.location.hash = '#/admin-dashboard'
    } else {
      window.location.hash = '#/mentee-dashboard'
    }
  }

  return (
    <div className="container py-4">
      {/* Back button */}
      <button className="btn btn-outline-secondary btn-sm mb-4 rounded-3" onClick={handleBack}>
        <i className="bi bi-arrow-left me-2"></i>Dashboard
      </button>

      <div className="chat-window d-flex flex-row">
        
        {/* Contacts Sidebar List */}
        <div className="chat-sidebar col-4 d-flex flex-column h-100">
          <div className="p-3 border-bottom bg-light">
            <h6 className="fw-bold mb-0">Conversations</h6>
          </div>
          
          <div className="flex-grow-1 overflow-y-auto">
            {contactsLoading ? (
              <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-4 text-muted small px-2">No active contacts.</div>
            ) : (
              contacts.map(c => (
                <div 
                  key={c.email} 
                  className={`chat-contact d-flex align-items-center gap-2 ${activeContact?.email === c.email ? 'active' : ''}`}
                  onClick={() => { setActiveContact(c); setMessages([]); }}
                >
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-uppercase small" style={{width: 38, height: 38, minWidth: 38}}>
                    {c.name?.charAt(0)}
                  </div>
                  <div className="text-truncate">
                    <div className="fw-semibold small text-dark text-truncate">{c.name}</div>
                    <span className="badge bg-secondary-subtle text-secondary xsmall" style={{fontSize: '0.7rem'}}>{c.role}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messaging Area Panel */}
        <div className="chat-body col-8 d-flex flex-column h-100 bg-white">
          {activeContact ? (
            <>
              {/* Active Header */}
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-light">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-uppercase small" style={{width: 38, height: 38}}>
                    {activeContact.name?.charAt(0)}
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark small">{activeContact.name}</h6>
                    <span className="text-muted xsmall" style={{fontSize: '0.75rem'}}>Online Mentorship Chat</span>
                  </div>
                </div>
                
                {/* Direct Video Call Room link if sessions exist */}
                <Link to="/calendar" className="btn btn-outline-primary btn-sm rounded-pill">
                  <i className="bi bi-camera-video-fill me-1"></i>Book Session
                </Link>
              </div>

              {/* Message Streams */}
              <div className="chat-messages flex-grow-1 p-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5 small">No chat history. Type a message below to start your conversation.</div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderEmail === user.email
                    return (
                      <div key={msg.id} className={`d-flex flex-column mb-3 ${isMe ? 'align-items-end' : 'align-items-start'}`}>
                        <div className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}>
                          {msg.text && <p className="mb-0 small">{msg.text}</p>}
                          {msg.fileUrl && (
                            <div className="mt-2 text-center p-2 rounded bg-dark bg-opacity-25">
                              <i className="bi bi-file-earmark-arrow-down-fill fs-4 text-white"></i>
                              <div className="small text-white text-truncate mt-1" style={{maxWidth: 160}}>{msg.fileName || 'Attachment'}</div>
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline-light py-0 mt-1 small">Download</a>
                            </div>
                          )}
                        </div>
                        <span className="text-muted xsmall px-2" style={{fontSize: '0.75rem'}}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    )
                  })
                )}
                
                {/* Typing Indicator */}
                {typing && (
                  <div className="d-flex align-items-center gap-1 text-muted xsmall px-2 py-1">
                    <span className="spinner-grow spinner-grow-sm text-primary" style={{width: 6, height: 6}}></span>
                    <span className="spinner-grow spinner-grow-sm text-primary" style={{width: 6, height: 6, animationDelay: '0.2s'}}></span>
                    <span className="spinner-grow spinner-grow-sm text-primary" style={{width: 6, height: 6, animationDelay: '0.4s'}}></span>
                    <span className="ms-1" style={{fontSize: '0.8rem'}}>{activeContact.name} is typing...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Box */}
              <div className="chat-input-area border-top">
                {attachmentName && (
                  <div className="alert alert-secondary py-1 px-2 small mb-2 d-flex justify-content-between align-items-center">
                    <span className="text-truncate small"><i className="bi bi-paperclip me-1"></i>{attachmentName}</span>
                    <button className="btn-close" style={{fontSize: '0.65rem'}} onClick={() => { setAttachmentName(''); setAttachmentData(null); }}></button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="d-flex gap-2 align-items-center">
                  
                  {/* File attach input */}
                  <label className="btn btn-outline-secondary btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: 36, height: 36, cursor: 'pointer'}} title="Attach Mock File">
                    <i className="bi bi-paperclip"></i>
                    <input type="file" className="d-none" onChange={handleMockAttachment} />
                  </label>

                  <input 
                    type="text" 
                    className="form-control form-control-sm flex-grow-1" 
                    placeholder="Type message details here..." 
                    value={typedMessage}
                    onChange={handleInputChange}
                  />

                  <button className="btn btn-primary btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: 36, height: 36}} type="submit">
                    <i className="bi bi-send-fill text-white"></i>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted p-5 text-center">
              <i className="bi bi-chat-left-text display-3 text-light-emphasis"></i>
              <h5 className="fw-bold mt-3">Platform Mentorship Chat</h5>
              <p className="small">Select a student or professional contact from the list on the left to start sending instant messages.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Messages
