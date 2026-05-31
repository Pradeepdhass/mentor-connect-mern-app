import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

function Reviews() {
  const { userData: user, loading } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
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
        const q = query(collection(db, "feedback"), where("mentorEmail", "==", user.email));
        const querySnapshot = await getDocs(q);
        const fetchedReviews = querySnapshot.docs.map(doc => doc.data());
        // Sort by createdAt descending since it's not indexed
        fetchedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setItems(fetchedReviews)
        setMsg('')
      } catch (e) {
        console.error("Fetch feedback error:", e);
        setMsg('Failed to load feedback.')
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


