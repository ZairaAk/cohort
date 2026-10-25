import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const links = [
  { to: '/matches', label: 'Matches' },
  { to: '/groups', label: 'Groups' },
  { to: '/questions', label: 'Q&A' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="nav">
        <strong className="brand">Cohort</strong>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <span className="spacer" />
        <span className="muted small">
          {user.name} · {user.reputation} rep · {user.streak?.count ?? 0} day streak
        </span>
        <button
          className="link"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Log out
        </button>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
