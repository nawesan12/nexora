export function EmptyActivity({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Timeline line */}
      <line x1="70" y1="25" x2="70" y2="140" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.2" strokeDasharray="4 4" />
      {/* Dot 1 */}
      <circle cx="70" cy="40" r="6" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.4" fill="var(--muted)" fillOpacity="0.4" />
      <line x1="84" y1="38" x2="140" y2="38" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      <line x1="84" y1="46" x2="120" y2="46" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.15" />
      {/* Dot 2 */}
      <circle cx="70" cy="75" r="6" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.3" fill="var(--muted)" fillOpacity="0.3" />
      <line x1="84" y1="73" x2="135" y2="73" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.15" />
      <line x1="84" y1="81" x2="115" y2="81" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.1" />
      {/* Dot 3 */}
      <circle cx="70" cy="110" r="6" stroke="var(--muted-foreground)" strokeWidth="1.5" opacity="0.2" fill="var(--muted)" fillOpacity="0.2" />
      <line x1="84" y1="108" x2="130" y2="108" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.1" />
      <line x1="84" y1="116" x2="110" y2="116" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeLinecap="round" opacity="0.08" />
      {/* Accent sparkle */}
      <circle cx="70" cy="40" r="2.5" fill="var(--accent)" opacity="0.6" />
    </svg>
  );
}
