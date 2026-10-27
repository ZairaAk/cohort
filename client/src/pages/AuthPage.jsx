import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { ErrorText } from '../components/ui.jsx';
import { Buddy, Dots } from '../components/Doodles.jsx';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/matches" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate(isRegister ? '/profile' : '/matches');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <Buddy />
      <h1>cohort</h1>
      <p className="muted">Find study partners. Study together. Help each other get better.</p>
      <form onSubmit={submit} className="stack">
        {isRegister && <input placeholder="Name" value={form.name} onChange={set('name')} required />}
        <input type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input type="password" placeholder="Password (8+ characters)" value={form.password} onChange={set('password')} required />
        <ErrorText error={error} />
        <button disabled={busy}>{busy ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}</button>
      </form>
      <p className="small" style={{ marginTop: 14 }}>
        {isRegister ? (
          <>
            Have an account? <Link to="/login">Log in</Link>
          </>
        ) : (
          <>
            New here? <Link to="/register">Create an account</Link>
          </>
        )}
      </p>
      <Dots />
    </div>
  );
}
