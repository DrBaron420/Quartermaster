interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  }[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizeClass} animate-spin rounded-full border-bg-tertiary border-t-accent`}
      />
      {label && <p className="text-sm text-text-muted">{label}</p>}
    </div>
  );
}

export default LoadingSpinner;
