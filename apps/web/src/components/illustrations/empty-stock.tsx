export function EmptyStock({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Chart background */}
      <rect
        x="35"
        y="30"
        width="130"
        height="100"
        rx="8"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Y-axis */}
      <line
        x1="55"
        y1="45"
        x2="55"
        y2="115"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* X-axis */}
      <line
        x1="55"
        y1="115"
        x2="150"
        y2="115"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Bar 1 */}
      <rect
        x="65"
        y="75"
        width="14"
        height="40"
        rx="2"
        fill="var(--primary)"
        opacity="0.6"
      />
      {/* Bar 2 */}
      <rect
        x="85"
        y="60"
        width="14"
        height="55"
        rx="2"
        fill="var(--primary)"
        opacity="0.4"
      />
      {/* Bar 3 */}
      <rect
        x="105"
        y="85"
        width="14"
        height="30"
        rx="2"
        fill="var(--primary)"
        opacity="0.6"
      />
      {/* Bar 4 */}
      <rect
        x="125"
        y="50"
        width="14"
        height="65"
        rx="2"
        fill="var(--primary)"
        opacity="0.4"
      />
      {/* Arrow up */}
      <path
        d="M80 38l-4 6h8l-4-6z"
        fill="var(--primary)"
        opacity="0.8"
      />
      <line
        x1="80"
        y1="44"
        x2="80"
        y2="52"
        stroke="var(--primary)"
        strokeWidth="1.5"
        opacity="0.8"
      />
      {/* Arrow down */}
      <path
        d="M120 52l-4-6h8l-4 6z"
        fill="var(--muted-foreground)"
        opacity="0.6"
      />
      <line
        x1="120"
        y1="40"
        x2="120"
        y2="46"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Sparkle */}
      <circle cx="155" cy="35" r="3" fill="var(--primary)" opacity="0.8" />
      <circle cx="163" cy="43" r="2" fill="var(--primary)" opacity="0.5" />
    </svg>
  );
}
