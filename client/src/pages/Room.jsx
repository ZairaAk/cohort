import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { connectSocket } from '../socket.js';
import { ErrorText } from '../components/ui.jsx';

const LABELS = { idle: 'Ready', focus: 'Focus', break: 'Break' };

function format(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function Room() {
  const { id } = useParams();
  const socketRef = useRef(null);
  const [state, setState] = useState(null);
  const [status, setStatus] = useState('connecting'); // connecting | joined | disconnected | denied
  const [error, setError] = useState('');
  const [skew, setSkew] = useState(0); // serverNow - clientNow, so every member sees the same countdown
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const applyState = (s) => {
      setState(s);
      setSkew(s.timer.serverNow - Date.now());
    };

    const join = () =>
      socket.emit('room:join', { groupId: id }, (res) => {
        if (res?.ok) {
          setStatus('joined');
          applyState(res.state);
        } else {
          setStatus('denied');
          setError(res?.error || 'Could not join the room');
        }
      });

    socket.on('connect', join); // also re-joins automatically after a reconnect
    socket.on('room:state', applyState);
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', (e) => {
      setStatus('disconnected');
      setError(e.message === 'unauthorized' ? 'Session expired. Log in again.' : 'Cannot connect to the room.');
    });

    return () => {
      socket.emit('room:leave');
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  function send(event) {
    setError('');
    socketRef.current.emit(event, {}, (res) => {
      if (!res?.ok) setError(res?.error || 'Something went wrong');
    });
  }

  const timer = state?.timer;
  const remaining = timer?.endsAt ? timer.endsAt - (now + skew) : timer?.focusMs ?? 0;

  return (
    <>
      <p className="small">
        <Link to={`/groups/${id}`}>Back to group</Link>
      </p>
      <h1>Study room</h1>
      <ErrorText error={error} />

      {status === 'connecting' && <p className="muted">Connecting...</p>}
      {status === 'disconnected' && <p className="error">Connection lost. Trying to reconnect...</p>}

      {status === 'joined' && timer && (
        <>
          <div className="card" style={{ textAlign: 'center' }}>
            <span className="tag">{LABELS[timer.phase]}</span>
            <div className="timer">{format(remaining)}</div>
            {timer.phase === 'idle' ? (
              <button onClick={() => send('timer:start')}>Start 25 minute focus</button>
            ) : (
              <button className="secondary" onClick={() => send('timer:stop')}>
                Stop timer
              </button>
            )}
            <p className="muted small">
              Everyone in the room sees the same timer. Finishing a focus block counts toward your group's weekly goal and your streak.
            </p>
          </div>

          <h2>In the room ({state.presence.length})</h2>
          {state.presence.map((p) => (
            <div key={p.userId} className="small" style={{ marginBottom: 4 }}>
              {p.name}
            </div>
          ))}
        </>
      )}
    </>
  );
}
