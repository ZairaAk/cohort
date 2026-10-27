import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const links = [
  { to: '/matches', label: 'Partners' },
  { to: '/groups', label: 'Groups' },
  { to: '/questions', label: 'Ask' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <header className="nav">
        <nav className="nav-left">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/matches" className="brand">
          cohort
        </NavLink>
        <div className="nav-right">
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
            {user.name.split(' ')[0]} · {user.reputation} rep · {user.streak?.count ?? 0}d streak
          </NavLink>
          <button
            className="link"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
