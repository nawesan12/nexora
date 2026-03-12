export function EmptyOrders({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Clipboard body */}
      <rect
        x="55"
        y="30"
        width="90"
        height="110"
        rx="8"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Clipboard clip */}
      <rect
        x="80"
        y="22"
        width="40"
        height="16"
        rx="4"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.6"
      />
      {/* Checklist line 1 */}
      <rect x="72" y="58" width="10" height="10" rx="2" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.4" />
      <line x1="88" y1="63" x2="125" y2="63" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      {/* Checklist line 2 */}
      <rect x="72" y="78" width="10" height="10" rx="2" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.4" />
      <line x1="88" y1="83" x2="118" y2="83" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      {/* Checklist line 3 */}
      <rect x="72" y="98" width="10" height="10" rx="2" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.4" />
      <line x1="88" y1="103" x2="122" y2="103" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      {/* Sparkle */}
      <circle cx="148" cy="35" r="3" fill="var(--accent)" opacity="0.8" />
      <circle cx="155" cy="48" r="2" fill="var(--accent)" opacity="0.5" />
    </svg>
  );
}
