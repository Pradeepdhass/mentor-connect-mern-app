import { useEffect, useRef } from 'react'

function CalendarPage() {
  const calendarRef = useRef(null)

  useEffect(() => {
    const el = calendarRef.current
    if (!el || !window.FullCalendar) return
    const calendar = new window.FullCalendar.Calendar(el, {
      initialView: 'timeGridWeek',
      selectable: true,
      editable: true,
      allDaySlot: false,
      slotMinTime: '08:00:00',
      slotMaxTime: '20:00:00',
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' },
      select: function (info) {
        const title = prompt('Enter availability note (e.g., "Available for mentoring"):')
        if (title) {
          calendar.addEvent({
            title,
            start: info.start,
            end: info.end,
            backgroundColor: '#10b981',
            borderColor: '#10b981',
            textColor: '#fff'
          })
        }
        calendar.unselect()
      },
      eventClick: function (info) {
        if (confirm('Delete this slot?')) info.event.remove()
      }
    })
    calendar.render()
    return () => calendar.destroy()
  }, [])

  return (
    <div className="container py-4" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
      <a href="/mentor-dashboard" className="btn btn-link text-decoration-none" style={{ position: 'absolute', top: 20, left: 20, fontSize: '1.2rem' }}>
        <i className="bi bi-arrow-left-circle-fill"></i> Back to Dashboard
      </a>
      <h3 className="text-center mb-4">Set Your Available Time Slots</h3>
      <div id="calendar" ref={calendarRef} style={{ maxWidth: 900, margin: '0 auto', background: 'white', padding: '1rem', borderRadius: 12, boxShadow: '0 0 10px rgba(0,0,0,0.1)' }} />
    </div>
  )
}

export default CalendarPage


