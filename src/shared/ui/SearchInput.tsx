interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        🔍
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg bg-bg-secondary border border-border pl-10 pr-4 py-2
                   text-sm text-text-primary placeholder:text-text-muted
                   focus:outline-none focus:border-accent transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted
                     hover:text-text-primary transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchInput;
