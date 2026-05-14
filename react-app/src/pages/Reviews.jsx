import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

function Reviews() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'))
    if (!user || user.role !== 'mentor') {
      window.location.href = '/login'
      return
    }
    const load = async () => {
      try {
        setMsg('Loading...')
        const resp = await fetch(`${API_BASE_URL}/api/feedback?mentorEmail=${encodeURIComponent(user.email)}`)
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.message || 'Failed to load')
        setItems(data)
        setMsg('')
      } catch (e) {
        setMsg('Failed to load feedback.')
      }
    }
    load()
  }, [])
  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-link p-0 me-2" onClick={() => navigate(-1)} aria-label="Back">
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <h4 className="mb-0">Reviews</h4>
      </div>
      {msg && <div className="alert alert-secondary py-2 small">{msg}</div>}
      {items.map((f, idx) => (
        <div key={idx} className="card p-3 mb-2">
          <div className="d-flex justify-content-between">
            <div>
              <strong>{f.menteeName}</strong> <span className="small text-muted">({f.menteeEmail})</span>
              <div className="small text-muted">{f.message}</div>
            </div>
            {typeof f.rating === 'number' && <span className="badge bg-success">{f.rating}★</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Reviews


