import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

function MyMentees() {
  const navigate = useNavigate()
  const [mentees, setMentees] = useState([])
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
        const resp = await fetch(`${API_BASE_URL}/api/mentees`)
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.message || 'Failed to load')
        setMentees(data)
        setMsg('')
      } catch (e) {
        setMsg('Failed to load mentees.')
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
        <h4 className="mb-0">My Mentees</h4>
      </div>
      {msg && <div className="alert alert-secondary py-2 small">{msg}</div>}
      {mentees.map((m, idx) => (
        <div key={idx} className="card p-3 mb-2">
          <div className="d-flex justify-content-between">
            <div>
              <strong>{m.name}</strong>
              <div className="small text-muted">{m.email}</div>
            </div>
            <div className="text-end">
              <div className="badge bg-success">{m.role}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MyMentees


