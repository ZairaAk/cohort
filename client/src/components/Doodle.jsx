// Original doodle: two friendly blobs studying over a book. Pure SVG, no assets.
export default function Doodle({ size = 260 }) {
  const ink = '#111';
  return (
    <svg
      viewBox="0 0 280 170"
      width={size}
      height={(size * 170) / 280}
      role="img"
      aria-label="Two friends studying together"
      fill="none"
      stroke={ink}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* blue blob */}
      <path d="M22 132 C8 84 36 38 78 46 C118 54 132 104 120 132 Z" fill="#5b73b0" />
      <circle cx="62" cy="82" r="2.6" fill={ink} />
      <circle cx="94" cy="84" r="2.6" fill={ink} />
      <path d="M66 102 Q79 112 93 102" />
      {/* mustard blob */}
      <path d="M160 132 C150 92 176 60 206 64 C238 68 250 106 242 132 Z" fill="#e5c65b" />
      <circle cx="193" cy="94" r="2.6" fill={ink} />
      <circle cx="218" cy="96" r="2.6" fill={ink} />
      <path d="M196 112 Q206 119 217 112" />
      {/* book */}
      <path d="M84 132 L140 132 L140 150 L84 150 Z" fill="#2f5d4a" />
      <path d="M112 132 L112 150" />
      {/* sun and squiggle */}
      <circle cx="250" cy="28" r="11" fill="#a8283a" />
      <path d="M150 30 q8 -12 16 0 t16 0" />
      <path d="M20 152 L264 152" />
    </svg>
  );
}
