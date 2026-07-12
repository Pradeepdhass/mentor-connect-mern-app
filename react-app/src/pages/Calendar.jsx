import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, getDocs, doc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore'

function CalendarPage() {
  const { userData: user, loading } = useAuth()
  const navigate = useNavigate()
  const calendarRef = useRef(null)
  
  const [mentorList, setMentorList] = useState([])
  const [selectedMentorEmail, setSelectedMentorEmail] = useState('all')
  const [slotsList, setSlotsList] = useState([])
  const [mySessions, setMySessions] = useState([])
  const [calendarInstance, setCalendarInstance] = useState(null)


  const [bookingSlot, setBookingSlot] = useState(null)
  const [bookingTitle, setBookingTitle] = useState('Mentorship Session')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingMsg, setBookingMsg] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login')
      return
    }
    fetchMentors()
    loadCalendarData()
  }, [user, loading, navigate])

  const fetchMentors = async () => {
    try {
      const q = query(collection(db, "mentors"))
      const snap = await getDocs(q)
      setMentorList(snap.docs.map(doc => doc.data()))
    } catch (err) {
      console.error(err)
    }
  }

  const loadCalendarData = async () => {
    try {
     
      const slotsSnap = await getDocs(collection(db, "availability_slots"))
      const fetchedSlots = slotsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setSlotsList(fetchedSlots)

      let qSessions
      if (user?.role === 'mentor') {
        qSessions = query(collection(db, "sessions"), where("mentorEmail", "==", user.email))
      } else {
        qSessions = query(collection(db, "sessions"), where("menteeEmail", "==", user.email))
      }
      const sessionsSnap = await getDocs(qSessions)
      setMySessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (loading || !user || !window.FullCalendar) return
    const el = calendarRef.current
    if (!el) return

    const events = []

    slotsList.forEach(slot => {
      if (selectedMentorEmail !== 'all' && slot.mentorEmail !== selectedMentorEmail) {
        return
      }

      const isMyOwnSlot = user.role === 'mentor' && slot.mentorEmail === user.email
      
      events.push({
        id: `slot_${slot.id}`,
        title: isMyOwnSlot ? `Available: ${slot.title || 'Slot'}` : `${slot.mentorName}: Available`,
        start: slot.start,
        end: slot.end,
        backgroundColor: isMyOwnSlot ? '#10b981' : '#3b82f6',
        borderColor: isMyOwnSlot ? '#059669' : '#2563eb',
        textColor: '#ffffff',
        extendedProps: {
          type: 'slot',
          data: slot
        }
      })
    })

    mySessions.forEach(sess => {
      events.push({
        id: `sess_${sess.id}`,
        title: `Booked: ${sess.title}`,
        start: `${sess.date}T${sess.time}:00`,

        end: `${sess.date}T${Number(sess.time.split(':')[0]) + 1}:${sess.time.split(':')[1]}:00`,
        backgroundColor: sess.status === 'approved' ? '#8b5cf6' : '#f59e0b',
        borderColor: sess.status === 'approved' ? '#7c3aed' : '#d97706',
        textColor: '#ffffff',
        extendedProps: {
          type: 'session',
          data: sess
        }
      })
    })

    const calendar = new window.FullCalendar.Calendar(el, {
      initialView: 'timeGridWeek',
      selectable: user.role === 'mentor', 
      editable: false,
      allDaySlot: false,
      slotMinTime: '08:00:00',
      slotMaxTime: '21:00:00',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,timeGridDay'
      },
      events: events,
      select: async function (info) {
        if (user.role !== 'mentor') return
        const title = prompt('Enter note for this slot (e.g. "Mock Interview Help", "Career Talk"):')
        if (title) {
          try {
            await addDoc(collection(db, "availability_slots"), {
              mentorEmail: user.email,
              mentorName: user.name,
              start: info.startStr,
              end: info.endStr,
              title: title,
              createdAt: new Date().toISOString()
            })
            loadCalendarData()
          } catch (err) {
            console.error(err)
          }
        }
        calendar.unselect()
      },
      eventClick: async function (info) {
        const type = info.event.extendedProps.type
        const data = info.event.extendedProps.data

        if (type === 'slot') {
          if (user.role === 'mentor') {
            if (data.mentorEmail !== user.email) return
            if (confirm(`Remove this availability slot?`)) {
              try {
                await deleteDoc(doc(db, "availability_slots", data.id))
                loadCalendarData()
              } catch (err) {
                console.error(err)
              }
            }
          } else if (user.role === 'mentee') {
            setBookingSlot(data)
            setBookingTitle('Mentorship Review')
            setShowBookingModal(true)
          }
        } else if (type === 'session') {
          if (data.status === 'approved') {
            if (confirm(`Join video call room for session "${data.title}"?`)) {
              navigate(`/video-call/${data.id}`)
            }
          } else {
            alert(`Session details:\nTopic: ${data.title}\nStatus: ${data.status}\nTime: ${data.date} at ${data.time}`)
          }
        }
      }
    })

    calendar.render()
    setCalendarInstance(calendar)

    return () => calendar.destroy()
  }, [slotsList, mySessions, selectedMentorEmail, user, loading, navigate])

  const handleBookSession = async (e) => {
    e.preventDefault()
    if (!bookingSlot) return
    setBookingMsg('Confirming session booking...')

    try {
      const sessionDate = bookingSlot.start.split('T')[0]
      const sessionTime = bookingSlot.start.split('T')[1].substring(0, 5) 

      await addDoc(collection(db, "sessions"), {
        menteeEmail: user.email,
        menteeName: user.name,
        mentorEmail: bookingSlot.mentorEmail,
        mentorName: bookingSlot.mentorName,
        title: bookingTitle,
        date: sessionDate,
        time: sessionTime,
        status: 'approved', 
        createdAt: new Date().toISOString(),
        notes: ''
      })

      await deleteDoc(doc(db, "availability_slots", bookingSlot.id))

      setBookingMsg('✅ Booking confirmed!')
      loadCalendarData()
      setTimeout(() => {
        setShowBookingModal(false)
        setBookingMsg('')
      }, 1500)

    } catch (err) {
      console.error(err)
      setBookingMsg('❌ Booking failed. Try again.')
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

      <div className="card-box bg-white p-4">
        <h4 className="fw-bold mb-1"><i className="bi bi-calendar-range text-primary me-2"></i>Scheduling Center</h4>
        <p className="text-muted small mb-4">
          {user?.role === 'mentor' 
            ? 'Drag or click on time grids to create availability blocks. Mentees will see these blocks to schedule video meetings.' 
            : 'Explore available hours below. Click any blue availability block to book your mentorship session instantly.'}
        </p>

        {/* Mentee filter drop down */}
        {user?.role === 'mentee' && (
          <div className="mb-4 d-flex align-items-center gap-2" style={{ maxWidth: 350 }}>
            <label className="form-label mb-0 small text-nowrap fw-semibold">Filter Mentor Availability:</label>
            <select 
              className="form-select form-select-sm" 
              value={selectedMentorEmail} 
              onChange={e => setSelectedMentorEmail(e.target.value)}
            >
              <option value="all">-- All Mentors --</option>
              {mentorList.map(m => (
                <option key={m.email} value={m.email}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        <div id="calendar" ref={calendarRef} style={{ background: '#fff', padding: '1rem', borderRadius: 16, border: '1px solid #f1f5f9' }} />
      </div>

      {/* Booking confirmation modal */}
      {showBookingModal && bookingSlot && (
        <div className="modal fade show d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-bottom-0">
                <h5 className="modal-title fw-bold">Confirm Mentorship Booking</h5>
                <button type="button" className="btn-close" onClick={() => setShowBookingModal(false)}></button>
              </div>
              <form onSubmit={handleBookSession}>
                <div className="modal-body py-0">
                  <p className="small text-muted">Book a video mentoring session with <strong>{bookingSlot.mentorName}</strong>.</p>
                  
                  {bookingMsg && <div className="alert alert-info py-2 small">{bookingMsg}</div>}

                  <div className="mb-3">
                    <label className="form-label">Call Focus Topic</label>
                    <select className="form-select form-select-sm" value={bookingTitle} onChange={e => setBookingTitle(e.target.value)}>
                      <option value="Career Mentoring">General Career Guidance</option>
                      <option value="Resume Review">Resume & Profile Review</option>
                      <option value="Technical Training">Tech Skill Mentorship</option>
                      <option value="Interview Prep">Mock Interview Prep</option>
                    </select>
                  </div>

                  <div className="card p-3 border-0 bg-light rounded-3">
                    <div className="small text-dark mb-1"><strong>Mentor:</strong> {bookingSlot.mentorName}</div>
                    <div className="small text-dark mb-1"><strong>Date:</strong> {bookingSlot.start.split('T')[0]}</div>
                    <div className="small text-dark"><strong>Time Slot:</strong> {bookingSlot.start.split('T')[1].substring(0, 5)} - {bookingSlot.end.split('T')[1].substring(0, 5)}</div>
                  </div>
                </div>
                <div className="modal-footer border-top-0 mt-3">
                  <button type="submit" className="btn btn-sm btn-primary">Confirm Book Session</button>
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

export default CalendarPage
