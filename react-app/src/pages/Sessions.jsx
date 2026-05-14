import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Sessions() {
  const navigate = useNavigate()
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'))
    if (!user) {
      window.location.href = '/login'
      return
    }
  }, [])

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-link p-0 me-2" onClick={() => navigate(-1)} aria-label="Back">
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <h4 className="mb-0">Sessions</h4>
      </div>
      <div className="card p-3 mb-3">
        <div className="d-flex justify-content-between">
          <div>
            <strong>Portfolio Review</strong>
            <div className="text-muted small">Fri, 5:00 PM - 6:00 PM</div>
          </div>
          <button className="btn btn-outline-primary btn-sm">Join</button>
        </div>
      </div>
      <div className="card p-3 mb-3">
        <div className="d-flex justify-content-between">
          <div>
            <strong>Career Guidance</strong>
            <div className="text-muted small">Mon, 11:00 AM - 12:00 PM</div>
          </div>
          <button className="btn btn-outline-secondary btn-sm">Details</button>
        </div>
      </div>
    </div>
  )
}

export default Sessions


