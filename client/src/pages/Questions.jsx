import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { Empty, ErrorText, useLoad } from '../components/ui.jsx';

export default function Questions() {
  const [params] = useSearchParams();
  const groupId = params.get('groupId') || '';
  const [subject, setSubject] = useState('');
  const query = new URLSearchParams({ ...(groupId && { groupId }), ...(subject.trim() && { subject: subject.trim() }) });
  const { data, loading, error, reload } = useLoad(() => api(`/questions?${query}`), [groupId, subject]);

  const [form, setForm] = useState({ title: '', body: '', subject: '' });
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  async function ask(e) {
    e.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      await api('/questions', { method: 'POST', body: { ...form, ...(groupId && { groupId }) } });
      setForm({ title: '', body: '', subject: '' });
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>{groupId ? 'Group questions' : 'Ask & answer'}</h1>
      {groupId && (
        <p className="small">
          <Link to={`/groups/${groupId}`}>Back to group</Link> · only members can see these.
        </p>
      )}
      <input placeholder="Filter by subject" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ marginBottom: 12 }} />

      <ErrorText error={error} />
      {loading && <p className="muted">Loading...</p>}
      {data?.questions.length === 0 && <Empty>No questions yet. Ask the first one below.</Empty>}
      {data?.questions.map((q) => (
        <Link to={`/questions/${q.id}`} key={q.id} style={{ textDecoration: 'none' }}>
          <div className={`card ${q.accepted ? 'accepted' : ''}`}>
            <div className="row between">
              <h3>{q.title}</h3>
              <span className="tag">{q.subject}</span>
            </div>
            <span className="muted small">
              {q.author.name} · {q.answerCount} answer{q.answerCount === 1 ? '' : 's'}
              {q.accepted ? ' · solved' : ''}
            </span>
          </div>
        </Link>
      ))}

      <div className="section">
        <h2>Ask a question</h2>
        <form className="stack" onSubmit={ask} style={{ maxWidth: 520 }}>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <textarea placeholder="Describe what you are stuck on" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          <ErrorText error={formError} />
          <button disabled={busy}>{busy ? 'Posting...' : 'Post question'}</button>
        </form>
      </div>
    </>
  );
}
