'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300">
        ⌕
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-purple-200 bg-white py-2.5 pl-8 pr-3 text-sm text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
    </div>
  );
}
