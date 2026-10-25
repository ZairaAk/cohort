import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Empty, ErrorText, formatHours, useLoad } from '../components/ui.jsx';

export default function Matches() {
  const { data, loading, error } = useLoad(() => api('/matches'));

  return (
    <>
      <h1>Study partners</h1>
      <p className="muted">Ranked by shared subjects, skill fit, and overlapping free time.</p>
      <ErrorText error={error} />
      {loading && <p className="muted">Finding matches...</p>}

      {data && !data.profileReady && (
        <Empty>
          Add at least one subject and one availability slot in your <Link to="/profile">profile</Link> to get matches.
        </Empty>
      )}
      {data?.profileReady && data.matches.length === 0 && (
        <Empty>No matches yet. Try adding more subjects or time slots, or check back as more students join.</Empty>
      )}

      {data?.matches.map((m) => (
        <div className="card" key={m.userId}>
          <div className="row between">
            <div>
              <h3>{m.name}</h3>
              <span className="muted small">
                {m.reputation} rep · {formatHours(m.overlapMinutes)} shared per week
              </span>
            </div>
            <span className="score">{m.score}%</span>
          </div>
          <div style={{ marginTop: 8 }}>
            {m.sharedSubjects.map((s) => (
              <span className="tag" key={s.name}>
                {s.name}: you L{s.yourLevel}, them L{s.theirLevel}
              </span>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
