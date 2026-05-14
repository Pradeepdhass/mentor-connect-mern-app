import { useNavigate } from 'react-router-dom'

function Progress() {
  const navigate = useNavigate()
  return (
    <div className="container py-4">
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-link p-0 me-2" onClick={() => navigate(-1)} aria-label="Back">
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <h4 className="mb-0">Progress</h4>
      </div>
      <div className="row g-3">
        <div className="col-md-4">
          <div className="card p-3">
            <small className="text-primary">Overall</small>
            <div className="fw-bold fs-5">76%</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3">
            <small className="text-primary">Assignments</small>
            <div className="fw-bold fs-5">14/18</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3">
            <small className="text-primary">Sessions Attended</small>
            <div className="fw-bold fs-5">12</div>
          </div>
        </div>
      </div>
      <div className="card p-3 mt-3">
        <h6>Milestones</h6>
        <ul className="mb-0">
          <li>Intro course - completed</li>
          <li>Portfolio draft - in review</li>
          <li>Mock interview - scheduled</li>
        </ul>
      </div>
    </div>
  )
}

export default Progress


