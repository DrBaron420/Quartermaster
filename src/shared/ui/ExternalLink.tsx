interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Opens a URL in the user's default browser.
 * Works in both Tauri (via shell plugin) and regular browser.
 */
function ExternalLink({ href, children, className = "" }: ExternalLinkProps) {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if ("__TAURI_INTERNALS__" in window) {
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(href);
      } catch (err) {
        console.error("Failed to open URL:", err);
        window.open(href, "_blank");
      }
    } else {
      window.open(href, "_blank");
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export default ExternalLink;
