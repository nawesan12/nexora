export function EmptyVehicles({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Car body */}
      <path
        d="M40 95h120a8 8 0 018 8v10a4 4 0 01-4 4H36a4 4 0 01-4-4v-10a8 8 0 018-8z"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Car roof */}
      <path
        d="M60 95l12-30h56l12 30"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.3"
      />
      {/* Windshield */}
      <path
        d="M74 70l-8 20h68l-8-20"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        fill="none"
        opacity="0.3"
      />
      {/* Window divider */}
      <line
        x1="100"
        y1="70"
        x2="100"
        y2="90"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        opacity="0.3"
      />
      {/* Headlight left */}
      <rect
        x="36"
        y="100"
        width="10"
        height="5"
        rx="2"
        fill="var(--primary)"
        opacity="0.5"
      />
      {/* Headlight right */}
      <rect
        x="154"
        y="100"
        width="10"
        height="5"
        rx="2"
        fill="var(--primary)"
        opacity="0.5"
      />
      {/* Left wheel */}
      <circle
        cx="65"
        cy="117"
        r="9"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.6"
      />
      <circle cx="65" cy="117" r="4" fill="var(--muted-foreground)" opacity="0.3" />
      {/* Right wheel */}
      <circle
        cx="135"
        cy="117"
        r="9"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.6"
      />
      <circle cx="135" cy="117" r="4" fill="var(--muted-foreground)" opacity="0.3" />
      {/* Ground line */}
      <line
        x1="20"
        y1="126"
        x2="180"
        y2="126"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.3"
      />
      {/* Sparkle */}
      <circle cx="155" cy="55" r="3" fill="var(--primary)" opacity="0.8" />
      <circle cx="163" cy="63" r="2" fill="var(--primary)" opacity="0.5" />
    </svg>
  );
}
