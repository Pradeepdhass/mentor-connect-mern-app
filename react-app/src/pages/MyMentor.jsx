import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'

function MyMentor() {
  const [mentors, setMentors] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Restrict page to mentees only
    const currentUserJson = localStorage.getItem('currentUser')
    const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null
    if (!currentUser || String(currentUser.role || '').toLowerCase() !== 'mentee') {
      window.location.href = '/login'
      return
    }

    const fetchMentors = async () => {
      setMessage('Loading mentors...')
      try {
        const q = query(collection(db, "users"), where("role", "==", "mentor"));
        const querySnapshot = await getDocs(q);
        const fetchedMentors = querySnapshot.docs.map(doc => doc.data());
        setMentors(fetchedMentors)
        setMessage(fetchedMentors.length ? '' : 'No mentors are currently available.')
      } catch (e) {
        console.error(e)
        setMessage('❌ Network Error. Could not fetch mentors.')
      }
    }
    fetchMentors()
  }, [])

  const handleSubmitReview = async (e, mentorEmail) => {
    e.preventDefault()
    const currentUser = JSON.parse(localStorage.getItem('currentUser'))
    const form = e.currentTarget
    const text = form.querySelector('textarea')?.value.trim()
    const rating = Number(form.querySelector('select')?.value || 0)
    const status = form.querySelector('.reviewStatus')
    const userRole = String(currentUser?.role || '').toLowerCase()
    if (!currentUser || userRole !== 'mentee') {
      if (status) status.textContent = 'Only mentees can submit reviews.'
      return
    }
    if (!text) {
      if (status) status.textContent = 'Please enter your review.'
      return
    }
    if (status) {
      status.textContent = 'Submitting review...'
    }
    try {
      await addDoc(collection(db, "feedback"), {
        menteeEmail: currentUser.email,
        menteeName: currentUser.name,
        mentorEmail,
        message: text,
        rating: rating || null,
        createdAt: new Date().toISOString()
      });
      if (status) status.textContent = '✅ Review submitted.'
      form.reset()
    } catch (err) {
      console.error(err)
      if (status) status.textContent = '❌ Failed to submit review.'
    }
  }

  return (
    <div className="p-4 bg-light">
      <a href="/mentee-dashboard" className="btn btn-outline-secondary mb-4"><i className="bi bi-arrow-left me-2"></i> Back to Dashboard</a>
      <div className="container">
        <h3 className="mb-4">Available Mentors</h3>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4" id="mentorsList">
          {mentors.map((mentor) => (
            <div className="col" key={mentor.email}>
              <div className="card shadow-sm h-100 border-success border-3 border-start-0">
                <div className="card-body">
                  <h5 className="card-title text-success">{mentor.name}</h5>
                  <p className="card-text mb-1"><i className="bi bi-envelope me-2"></i> Email: <strong>{mentor.email}</strong></p>
                  <p className="card-text mb-3"><i className="bi bi-briefcase me-2"></i> Role: <span className="badge bg-success">{mentor.role?.charAt(0).toUpperCase() + mentor.role?.slice(1)}</span></p>
                  <button className="btn btn-sm btn-primary mb-3">Request Mentorship</button>
                  <div className="border-top pt-3">
                    <h6 className="mb-2">Leave a Review</h6>
                    <form onSubmit={(e) => handleSubmitReview(e, mentor.email)}>
                      <div className="row g-2">
                        <div className="col-4">
                          <select className="form-select form-select-sm">
                            <option value="">Rating</option>
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Good</option>
                            <option value="3">3 - Average</option>
                            <option value="2">2 - Poor</option>
                            <option value="1">1 - Bad</option>
                          </select>
                        </div>
                        <div className="col-8">
                          <button type="submit" className="btn btn-success btn-sm w-100">Submit Review</button>
                        </div>
                      </div>
                      <textarea className="form-control form-control-sm mt-2" rows="2" placeholder="Write your feedback..." required></textarea>
                      <div className="reviewStatus small mt-2"></div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div id="message" className="mt-4 text-center">{message && <p className={message.startsWith('❌') ? 'text-danger' : 'text-muted'}>{message}</p>}</div>
      </div>
    </div>
  )
}

export default MyMentor


