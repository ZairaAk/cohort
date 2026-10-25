import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { DAYS, ErrorText, minToTime, timeToMin } from '../components/ui.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [subjects, setSubjects] = useState(user.subjects.map((s) => ({ ...s })));
  const [slots, setSlots] = useState(user.availability.map((s) => ({ ...s })));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const updateSubject = (i, patch) => setSubjects(subjects.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateSlot = (i, patch) => setSlots(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  async function save() {
    setError('');
    setSaved(false);
    const cleaned = subjects.map((s) => ({ name: s.name.trim().toLowerCase(), level: Number(s.level) })).filter((s) => s.name);
    if (slots.some((s) => s.endMin <= s.startMin)) return setError('Each slot must end after it starts');
    setBusy(true);
    try {
      const d = await api('/users/me', { method: 'PUT', body: { subjects: cleaned, availability: slots } });
      setUser(d.user);
      setSubjects(d.user.subjects);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Your profile</h1>
      <p className="muted">Matching uses your subjects, skill levels, and weekly availability.</p>

      <div className="section">
        <h2>Subjects</h2>
        {subjects.map((s, i) => (
          <div className="row" key={i} style={{ marginBottom: 8 }}>
            <input placeholder="e.g. data structures" value={s.name} onChange={(e) => updateSubject(i, { name: e.target.value })} />
            <select value={s.level} onChange={(e) => updateSubject(i, { level: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
            <button className="secondary" onClick={() => setSubjects(subjects.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button className="secondary" onClick={() => setSubjects([...subjects, { name: '', level: 3 }])}>
          Add subject
        </button>
      </div>

      <div className="section">
        <h2>Weekly availability</h2>
        {slots.map((s, i) => (
          <div className="row" key={i} style={{ marginBottom: 8 }}>
            <select value={s.day} onChange={(e) => updateSlot(i, { day: Number(e.target.value) })}>
              {DAYS.map((d, idx) => (
                <option key={d} value={idx}>
                  {d}
                </option>
              ))}
            </select>
            <input type="time" value={minToTime(s.startMin)} onChange={(e) => updateSlot(i, { startMin: timeToMin(e.target.value) })} />
            <span className="muted">to</span>
            <input type="time" value={minToTime(s.endMin === 1440 ? 1439 : s.endMin)} onChange={(e) => updateSlot(i, { endMin: timeToMin(e.target.value) })} />
            <button className="secondary" onClick={() => setSlots(slots.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button className="secondary" onClick={() => setSlots([...slots, { day: 1, startMin: 18 * 60, endMin: 20 * 60 }])}>
          Add time slot
        </button>
      </div>

      <div className="section stack" style={{ maxWidth: 240 }}>
        <ErrorText error={error} />
        {saved && <p className="ok">Saved</p>}
        <button onClick={save} disabled={busy}>
          {busy ? 'Saving...' : 'Save profile'}
        </button>
      </div>
    </>
  );
}
