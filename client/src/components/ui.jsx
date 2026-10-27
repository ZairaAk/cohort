import { useEffect, useState } from 'react';
import { Blocks } from './Doodles.jsx';

export const ErrorText = ({ error }) => (error ? <p className="error">{error}</p> : null);

export const Empty = ({ children }) => (
  <div className="empty">
    <Blocks size={110} />
    <span>{children}</span>
  </div>
);

// Small data-loading hook with loading and error states.
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn()
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: e.message }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const minToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const timeToMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
export const formatHours = (min) => `${(min / 60).toFixed(1)}h`;
