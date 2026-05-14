import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Profile() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'))
    if (!user) {
      window.location.href = '/login'
      return
    }
    setName(user.name || '')
    setEmail(user.email || '')
    setRole(user.role || '')
  }, [])

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-link p-0 me-2" onClick={() => navigate(-1)} aria-label="Back">
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <h4 className="mb-0">Profile</h4>
      </div>
      <div className="card p-3">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Name</label>
            <input className="form-control" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Email</label>
            <input className="form-control" value={email} disabled />
          </div>
          <div className="col-md-6">
            <label className="form-label">Role</label>
            <input className="form-control" value={role} disabled />
          </div>
        </div>
        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-primary btn-sm">Save</button>
          <button className="btn btn-outline-secondary btn-sm">Cancel</button>
        </div>
        {msg && <div className="small mt-2">{msg}</div>}
      </div>
    </div>
  )
}

export default Profile


