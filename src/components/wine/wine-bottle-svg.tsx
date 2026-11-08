import type { WineType } from "@/lib/types";

const colors: Record<
  WineType,
  { glass: string; glassDeep: string; wine: string; foil: string; label: string; cork: string }
> = {
  rød: {
    glass: "#3a1520",
    glassDeep: "#16080c",
    wine: "#7a1a2c",
    foil: "#8a6a28",
    label: "#e8d9b0",
    cork: "#c4a06a",
  },
  hvid: {
    glass: "#3a3420",
    glassDeep: "#1c1810",
    wine: "#d4c478",
    foil: "#b89a4a",
    label: "#f2ead2",
    cork: "#c4a06a",
  },
  rosé: {
    glass: "#3a1820",
    glassDeep: "#1a0c10",
    wine: "#c4788a",
    foil: "#a88840",
    label: "#f0e4d0",
    cork: "#c4a06a",
  },
  mousserende: {
    glass: "#243018",
    glassDeep: "#12180c",
    wine: "#c8d090",
    foil: "#c4a35a",
    label: "#efe6cf",
    cork: "#d8c49a",
  },
  portvin: {
    glass: "#2a0c14",
    glassDeep: "#100508",
    wine: "#4a0c18",
    foil: "#6a4820",
    label: "#e2d2a8",
    cork: "#b89060",
  },
  madeira: {
    glass: "#2c140c",
    glassDeep: "#140808",
    wine: "#6a2810",
    foil: "#8a6a28",
    label: "#ead8b0",
    cork: "#c4a06a",
  },
  sherry: {
    glass: "#3a2810",
    glassDeep: "#1a1208",
    wine: "#b88830",
    foil: "#9a7a30",
    label: "#f0e4c8",
    cork: "#c4a06a",
  },
  dessert: {
    glass: "#3a2410",
    glassDeep: "#1a1008",
    wine: "#c89828",
    foil: "#c4a35a",
    label: "#f5e8c8",
    cork: "#d0b070",
  },
  orange: {
    glass: "#3a2410",
    glassDeep: "#1c1208",
    wine: "#c87828",
    foil: "#a87830",
    label: "#f0e0c0",
    cork: "#c4a06a",
  },
  anden: {
    glass: "#2a2418",
    glassDeep: "#14110c",
    wine: "#7a6040",
    foil: "#9a7a38",
    label: "#e8dcc0",
    cork: "#c4a06a",
  },
};

type Props = {
  wineType?: WineType;
  empty?: boolean;
  imageUrl?: string;
  className?: string;
};

/** Bordeaux-style wine bottle drawn as SVG. */
export function WineBottleSvg({
  wineType = "anden",
  empty = false,
  imageUrl,
  className,
}: Props) {
  const c = colors[wineType];
  const sparkle = wineType === "mousserende";
  const gid = `b-${wineType}-${empty ? "e" : imageUrl ? "i" : "p"}`;

  if (empty) {
    return (
      <svg viewBox="0 0 72 180" className={className} aria-hidden fill="none">
        <path
          d="M31 10h10v12c0 3 1 5 2.5 7.5L51 48c3 5 4.5 11 4.5 17v88c0 9-6 15-15.5 15H32c-9.5 0-15.5-6-15.5-15V65c0-6 1.5-12 4.5-17l7.5-18.5C30 27 31 25 31 22V10z"
          stroke="rgba(196,163,90,0.32)"
          strokeWidth="1.6"
          strokeDasharray="4 3"
          fill="rgba(40,28,18,0.18)"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 72 180" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${gid}-body`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c.glassDeep} />
          <stop offset="32%" stopColor={c.glass} />
          <stop offset="48%" stopColor={c.wine} />
          <stop offset="70%" stopColor={c.glass} />
          <stop offset="100%" stopColor={c.glassDeep} />
        </linearGradient>
        <linearGradient id={`${gid}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id={`${gid}-label`}>
          <rect x="23" y="88" width="26" height="40" rx="2" />
        </clipPath>
      </defs>

      {/* Foil capsule */}
      <rect x="29" y="6" width="14" height="16" rx="2" fill={c.foil} />
      <rect x="29" y="17" width="14" height="3.5" fill={c.glassDeep} opacity="0.4" />
      {sparkle ? (
        <path d="M30 6h12l1.5 7H28.5L30 6z" fill="#f0e2b8" opacity="0.5" />
      ) : null}

      {/* Cork */}
      <rect x="31.5" y="19.5" width="9" height="6" rx="1" fill={c.cork} />

      {/* Neck */}
      <path
        d="M30.5 25h11v20c0 2.2-.6 4.2-1.8 5.8L36 58l-3.7-7.2C31.1 49.2 30.5 47.2 30.5 45V25z"
        fill={`url(#${gid}-body)`}
      />

      {/* Shoulders + body */}
      <path
        d="M24 56c4-7 9.5-12.5 12-14 2.2-1.3 4.8-1.3 7 0 2.5 1.5 8 7 12 14 3 4.5 4.5 9.5 4.5 14.5v84c0 8-5.2 13.5-13.5 13.5H33c-8.3 0-13.5-5.5-13.5-13.5V70.5C19.5 65.5 21 60.5 24 56z"
        fill={`url(#${gid}-body)`}
      />

      {/* Highlight */}
      <path
        d="M28 58c2-3.5 4.2-6.5 6-8.5 1.2 2.5 1.8 5.5 1.8 9v78c0 3-.4 5.5-1.2 7.5-2.8-1.2-4.1-4.2-4.1-8.5V62c0-1.5 0-2.8 0-4z"
        fill={`url(#${gid}-shine)`}
      />

      {/* Label */}
      {imageUrl ? (
        <image
          href={imageUrl}
          x="23"
          y="88"
          width="26"
          height="40"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${gid}-label)`}
        />
      ) : (
        <g>
          <rect x="23" y="88" width="26" height="40" rx="2" fill={c.label} opacity="0.94" />
          <rect x="26" y="93" width="20" height="2.2" rx="1" fill={c.glassDeep} opacity="0.28" />
          <rect x="28" y="99" width="16" height="1.6" rx="0.8" fill={c.glassDeep} opacity="0.18" />
          <rect x="29" y="104" width="14" height="1.6" rx="0.8" fill={c.glassDeep} opacity="0.14" />
          <circle cx="36" cy="116" r="4.5" fill={c.foil} opacity="0.4" />
        </g>
      )}

      {/* Base contact shadow */}
      <ellipse cx="36" cy="168" rx="13" ry="2.4" fill="rgba(0,0,0,0.4)" />
    </svg>
  );
}
