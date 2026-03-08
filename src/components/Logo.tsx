export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Gifted logo"
    >
      {/* Box lid */}
      <rect x="4" y="11" width="24" height="5" rx="1.5" fill="#7c3aed" />
      {/* Box body */}
      <rect x="5" y="16" width="22" height="13" rx="1.5" fill="#a78bfa" />
      {/* Box body shading on right side */}
      <rect x="20" y="16" width="7" height="13" rx="1.5" fill="#9061f9" />
      {/* Ribbon vertical stripe on lid */}
      <rect x="14" y="11" width="4" height="5" fill="#c4b5fd" />
      {/* Ribbon vertical stripe on body */}
      <rect x="14" y="16" width="4" height="13" fill="#c4b5fd" />
      {/* Left bow loop */}
      <path d="M14 13.5 C11 9, 5 9, 6 12 C7 15, 13 14, 14 13.5Z" fill="#ddd6fe" />
      {/* Right bow loop */}
      <path d="M18 13.5 C21 9, 27 9, 26 12 C25 15, 19 14, 18 13.5Z" fill="#ddd6fe" />
      {/* Bow knot */}
      <ellipse cx="16" cy="13.5" rx="2.2" ry="1.8" fill="#7c3aed" />
    </svg>
  );
}
