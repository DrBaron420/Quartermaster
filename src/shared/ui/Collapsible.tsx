import { useState } from "react";

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function Collapsible({
  title,
  defaultOpen = true,
  count,
  action,
  children,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
        >
          <span className="text-xs transition-transform" style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
            ▼
          </span>
          {title}
          {count !== undefined && (
            <span className="text-xs font-normal normal-case tracking-normal text-text-muted/60">
              ({count})
            </span>
          )}
        </button>
        {action && isOpen && action}
      </div>
      {isOpen && children}
    </div>
  );
}

export default Collapsible;
