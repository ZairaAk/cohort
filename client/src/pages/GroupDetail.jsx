import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { Empty, ErrorText, useLoad } from '../components/ui.jsx';

export default function GroupDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(() => api(`/groups/${id}`), [id]);
  const [actionError, setActionError] = useState('');

  async function act(fn) {
    setActionError('');
    try {
      await fn();
      reload();
    } catch (e) {
      setActionError(e.message);
    }
  }

  if (loading && !data) return <p className="muted">Loading...</p>;
  if (error) return <ErrorText error={error} />;
  const g = data.group;

  return (
    <>
      <div className="row between">
        <h1>{g.name}</h1>
        <span className="tag">{g.subject}</span>
      </div>
      {g.description && <p className="muted">{g.description}</p>}
      <ErrorText error={actionError} />

      {!g.isMember ? (
        <div className="section">
          <p className="muted">{g.memberCount} members. Join to see resources, progress, and the study room.</p>
          {g.hasRequested ? (
            <p className="ok">Request sent. Waiting for the owner to approve.</p>
          ) : (
            <button onClick={() => act(() => api(`/groups/${id}/join-requests`, { method: 'POST' }))}>Request to join</button>
          )}
        </div>
      ) : (
        <Member group={g} id={id} act={act} />
      )}
    </>
  );
}

function Member({ group: g, id, act }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="row" style={{ margin: '12px 0' }}>
        <Link to={`/groups/${id}/room`}>
          <button>Enter study room</button>
        </Link>
        <Link to={`/questions?groupId=${id}`}>
          <button className="secondary">Group Q&A</button>
        </Link>
        {!g.isOwner && (
          <button
            className="danger"
            onClick={() => act(async () => {
              await api(`/groups/${id}/members/me`, { method: 'DELETE' });
              navigate('/groups');
            })}
          >
            Leave group
          </button>
        )}
      </div>

      {g.isOwner && (
        <div className="section">
          <h2>Join requests</h2>
          {g.joinRequests.length === 0 && <Empty>No pending requests.</Empty>}
          {g.joinRequests.map((r) => (
            <div className="card row between" key={r.userId}>
              <span>{r.name}</span>
              <span className="row">
                <button onClick={() => act(() => api(`/groups/${id}/join-requests/${r.userId}/approve`, { method: 'POST' }))}>Approve</button>
                <button className="secondary" onClick={() => act(() => api(`/groups/${id}/join-requests/${r.userId}/reject`, { method: 'POST' }))}>
                  Reject
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      <Progress id={id} />

      <div className="section">
        <h2>Members ({g.members.length})</h2>
        {g.members.map((m) => (
          <div key={m.userId} className="row small" style={{ marginBottom: 4 }}>
            <span>{m.name}</span>
            {m.role === 'owner' && <span className="tag">owner</span>}
            <span className="muted">{m.reputation} rep</span>
          </div>
        ))}
      </div>

      <Resources id={id} groupOwner={g.isOwner} />
    </>
  );
}

function Progress({ id }) {
  const { data, error } = useLoad(() => api(`/groups/${id}/stats`), [id]);
  if (error) return <ErrorText error={error} />;
  if (!data) return null;
  const pct = Math.min(100, Math.round((data.totalMinutes / data.goalMinutes) * 100));
  return (
    <div className="section">
      <h2>This week</h2>
      <div className="bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      <p className="muted small">
        {data.totalMinutes} of {data.goalMinutes} focus minutes ({pct}%)
      </p>
      {data.leaderboard.length === 0 && <Empty>No focus sessions yet. Start one in the study room.</Empty>}
      {data.leaderboard.map((r) => (
        <div key={r.userId} className="row between small" style={{ marginBottom: 4 }}>
          <span>{r.name}</span>
          <span className="muted">
            {r.minutes} min · {r.streak} day streak
          </span>
        </div>
      ))}
    </div>
  );
}

function Resources({ id, groupOwner }) {
  const { user } = useAuth();
  const { data, error, reload } = useLoad(() => api(`/groups/${id}/resources`), [id]);
  const [form, setForm] = useState({ title: '', url: '' });
  const [formError, setFormError] = useState('');

  async function add(e) {
    e.preventDefault();
    setFormError('');
    try {
      await api(`/groups/${id}/resources`, { method: 'POST', body: form });
      setForm({ title: '', url: '' });
      reload();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function remove(rid) {
    try {
      await api(`/groups/${id}/resources/${rid}`, { method: 'DELETE' });
      reload();
    } catch (err) {
      setFormError(err.message);
    }
  }

  return (
    <div className="section">
      <h2>Shared resources</h2>
      <ErrorText error={error} />
      {data?.resources.length === 0 && <Empty>Nothing shared yet.</Empty>}
      {data?.resources.map((r) => (
        <div className="card row between" key={r.id}>
          <span>
            <a href={r.url} target="_blank" rel="noopener noreferrer">
              {r.title}
            </a>
            <span className="muted small"> · {r.uploaderName}</span>
          </span>
          {(r.uploaderId === user.id || groupOwner) && (
            <button className="secondary" onClick={() => remove(r.id)}>
              Delete
            </button>
          )}
        </div>
      ))}
      <form className="row" onSubmit={add}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
        <button>Share</button>
      </form>
      <ErrorText error={formError} />
    </div>
  );
}
