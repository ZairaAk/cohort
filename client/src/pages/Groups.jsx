import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Empty, ErrorText, useLoad } from '../components/ui.jsx';

export default function Groups() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [mine, setMine] = useState(false);
  const { data, loading, error } = useLoad(
    () => api(`/groups?${new URLSearchParams({ ...(subject.trim() && { subject: subject.trim() }), ...(mine && { mine: 'true' }) })}`),
    [subject, mine]
  );

  const [form, setForm] = useState({ name: '', subject: '', description: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function create(e) {
    e.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      const d = await api('/groups', { method: 'POST', body: form });
      navigate(`/groups/${d.group.id}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Groups</h1>

      <div className="row" style={{ marginBottom: 12 }}>
        <input placeholder="Filter by subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <label className="row small">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> My groups only
        </label>
      </div>

      <ErrorText error={error} />
      {loading && <p className="muted">Loading...</p>}
      {data?.groups.length === 0 && <Empty>No groups found. Create the first one below.</Empty>}
      {data?.groups.map((g) => (
        <Link to={`/groups/${g.id}`} key={g.id} style={{ textDecoration: 'none' }}>
          <div className="card">
            <div className="row between">
              <h3>{g.name}</h3>
              <span className="tag">{g.subject}</span>
            </div>
            <span className="muted small">
              {g.memberCount} member{g.memberCount === 1 ? '' : 's'}
              {g.isMember ? ' · You are in this group' : g.hasRequested ? ' · Request pending' : ''}
            </span>
          </div>
        </Link>
      ))}

      <div className="section">
        <h2>Create a group</h2>
        <form className="stack" onSubmit={create} style={{ maxWidth: 420 }}>
          <input placeholder="Group name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <textarea placeholder="What is this group about? (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <ErrorText error={formError} />
          <button disabled={busy}>{busy ? 'Creating...' : 'Create group'}</button>
        </form>
      </div>
    </>
  );
}
