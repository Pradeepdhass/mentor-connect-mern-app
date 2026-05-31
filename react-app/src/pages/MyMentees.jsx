import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

function MyMentees() {
  const { userData: user, loading } = useAuth()
  const navigate = useNavigate()
  const [mentees, setMentees] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (loading) return
    if (!user || user.role !== 'mentor') {
      navigate('/login')
      return
    }
    const load = async () => {
      try {
        setMsg('Loading...')
        const q = query(collection(db, "users"), where("role", "==", "mentee"));
        const querySnapshot = await getDocs(q);
        const fetchedMentees = querySnapshot.docs.map(doc => doc.data());
        setMentees(fetchedMentees)
        setMsg('')
      } catch (e) {
        console.error("Fetch error:", e);
        setMsg('Failed to load mentees.')
      }
    }
    load()
  }, [user, loading, navigate])
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


