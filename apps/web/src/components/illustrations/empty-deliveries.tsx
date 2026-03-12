export function EmptyDeliveries({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Truck body */}
      <rect
        x="30"
        y="60"
        width="80"
        height="45"
        rx="4"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.4"
      />
      {/* Truck cabin */}
      <path
        d="M110 75h25a6 6 0 016 6v24H110V75z"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.3"
      />
      {/* Cabin window */}
      <rect
        x="116"
        y="80"
        width="18"
        height="12"
        rx="2"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      {/* Wheels */}
      <circle
        cx="55"
        cy="108"
        r="8"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.6"
      />
      <circle cx="55" cy="108" r="3" fill="var(--muted-foreground)" opacity="0.3" />
      <circle
        cx="125"
        cy="108"
        r="8"
        stroke="var(--muted-foreground)"
        strokeWidth="1.5"
        fill="var(--muted)"
        fillOpacity="0.6"
      />
      <circle cx="125" cy="108" r="3" fill="var(--muted-foreground)" opacity="0.3" />
      {/* Ground line */}
      <line
        x1="20"
        y1="116"
        x2="180"
        y2="116"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.3"
      />
      {/* Route dots */}
      <circle cx="50" cy="40" r="4" fill="var(--primary)" opacity="0.8" />
      <circle cx="80" cy="35" r="3" fill="var(--primary)" opacity="0.5" />
      <circle cx="110" cy="42" r="3" fill="var(--primary)" opacity="0.5" />
      <circle cx="145" cy="38" r="4" fill="var(--primary)" opacity="0.8" />
      {/* Route connecting line */}
      <path
        d="M54 40 Q67 30 80 35 Q95 40 110 42 Q128 44 145 38"
        stroke="var(--primary)"
        strokeWidth="1"
        strokeDasharray="4 3"
        fill="none"
        opacity="0.4"
      />
      {/* Destination pin */}
      <path
        d="M145 38c0-5 4-9 4-13a4 4 0 10-8 0c0 4 4 8 4 13z"
        fill="var(--primary)"
        opacity="0.6"
      />
    </svg>
  );
}
