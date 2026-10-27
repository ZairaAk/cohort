// Original hand-drawn style illustrations, drawn with wobbly outlines and flat color fills.

const INK = '#1b1b1b';
const stroke = { stroke: INK, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' };

// A friendly blue creature holding a small block.
export function Buddy({ size = 170 }) {
  return (
    <svg className="doodle" width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="Friendly study buddy">
      <path d="M62 168 C54 120 56 76 74 44 C80 30 96 30 100 44 C104 30 120 32 122 46 C140 52 150 74 146 100 C143 126 150 150 152 168 Z" fill="#5b72b0" {...stroke} />
      <path d="M58 170 C90 176 120 176 156 170" fill="none" {...stroke} />
      <circle cx="96" cy="84" r="4" fill={INK} />
      <circle cx="122" cy="86" r="4" fill={INK} />
      <path d="M100 108 C108 114 118 114 124 106" fill="none" {...stroke} strokeWidth={2.5} />
      <rect x="150" y="136" width="30" height="30" rx="3" fill="#e8cd6a" {...stroke} />
    </svg>
  );
}

// A small stack of blocks for empty states.
export function Blocks({ size = 130 }) {
  return (
    <svg className="doodle" width={size} height={size * 0.75} viewBox="0 0 160 120" role="img" aria-label="Stack of blocks">
      <rect x="14" y="76" width="132" height="34" rx="3" fill="#f8f6f1" {...stroke} />
      <rect x="22" y="80" width="26" height="26" fill="#e8cd6a" />
      <path d="M84 110 V92 C84 78 112 78 112 92 V110" fill="#2f5d4a" {...stroke} />
      <rect x="30" y="42" width="52" height="34" rx="3" fill="#5b72b0" {...stroke} />
      <path d="M96 76 L112 42 L128 76 Z" fill="#a93a4a" {...stroke} />
      <circle cx="56" cy="26" r="12" fill="#e8cd6a" {...stroke} />
    </svg>
  );
}

export function Dots() {
  return (
    <div className="dots" aria-hidden="true">
      {['#a93a4a', '#5b72b0', '#5a3e5e', '#2f5d4a', '#e8cd6a'].map((c) => (
        <i key={c} style={{ background: c }} />
      ))}
    </div>
  );
}
