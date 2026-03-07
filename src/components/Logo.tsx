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
      {/* Left ribbon loop */}
      <path
        d="M16 14 C13 8, 3 6, 3 13 C3 19, 13 18, 16 14Z"
        fill="#a78bfa"
      />
      {/* Right ribbon loop */}
      <path
        d="M16 14 C19 8, 29 6, 29 13 C29 19, 19 18, 16 14Z"
        fill="#a78bfa"
      />
      {/* Left tail */}
      <path
        d="M14.5 16 L10 27 L12.5 28 L16.5 18"
        fill="#c4b5fd"
      />
      {/* Right tail */}
      <path
        d="M17.5 16 L22 27 L19.5 28 L15.5 18"
        fill="#c4b5fd"
      />
      {/* Center knot */}
      <ellipse cx="16" cy="14" rx="3" ry="2.5" fill="#7c3aed" />
    </svg>
  );
}
