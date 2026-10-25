import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Empty, ErrorText, useLoad } from '../components/ui.jsx';

export default function QuestionDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useLoad(() => api(`/questions/${id}`), [id]);
  const [body, setBody] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <p className="muted">Loading...</p>;
  if (error) return <ErrorText error={error} />;
  const q = data.question;

  async function answer(e) {
    e.preventDefault();
    setActionError('');
    setBusy(true);
    try {
      await api(`/questions/${id}/answers`, { method: 'POST', body: { body } });
      setBody('');
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function accept(answerId) {
    setActionError('');
    try {
      await api(`/questions/${id}/accept/${answerId}`, { method: 'POST' });
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <>
      <p className="small">
        <Link to={q.groupId ? `/questions?groupId=${q.groupId}` : '/questions'}>Back to questions</Link>
      </p>
      <div className="row between">
        <h1>{q.title}</h1>
        <span className="tag">{q.subject}</span>
      </div>
      <p className="muted small">
        Asked by {q.author.name} ({q.author.reputation} rep)
      </p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{q.body}</p>

      <div className="section">
        <h2>
          {q.answers.length} answer{q.answers.length === 1 ? '' : 's'}
        </h2>
        <ErrorText error={actionError} />
        {q.answers.length === 0 && <Empty>No answers yet.</Empty>}
        {q.answers.map((a) => (
          <div className={`card ${a.isAccepted ? 'accepted' : ''}`} key={a.id}>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{a.body}</p>
            <div className="row between small">
              <span className="muted">
                {a.author.name} ({a.author.reputation} rep)
                {a.isAccepted && <span className="ok"> · accepted</span>}
              </span>
              {q.canAccept && !a.isAccepted && a.author.id !== q.author.id && (
                <button className="secondary" onClick={() => accept(a.id)}>
                  Accept answer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="stack section" onSubmit={answer} style={{ maxWidth: 520 }}>
        <h2>Your answer</h2>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share what helped you" required />
        <button disabled={busy}>{busy ? 'Posting...' : 'Post answer'}</button>
      </form>
    </>
  );
}
