"use client";

import { useId } from "react";
import type { WineType } from "@/lib/types";
import { bottleLabelCopy, bottleShape, type BottleShape } from "@/lib/shelf";

type Glass = {
  deep: string;
  mid: string;
  wine: string;
  foil: string;
  foilDeep: string;
  paper: string;
  ink: string;
};

const GLASS: Record<WineType, Glass> = {
  rød: {
    deep: "#14080c",
    mid: "#4a1824",
    wine: "#7a2432",
    foil: "#c4a35a",
    foilDeep: "#5c431c",
    paper: "#f4e7c8",
    ink: "#3a2714",
  },
  hvid: {
    deep: "#16140c",
    mid: "#6a6234",
    wine: "#e4d48a",
    foil: "#d7c48a",
    foilDeep: "#7a6840",
    paper: "#f7f1e4",
    ink: "#3a2714",
  },
  rosé: {
    deep: "#160a10",
    mid: "#6a3040",
    wine: "#d48996",
    foil: "#c4a35a",
    foilDeep: "#6a5428",
    paper: "#f8efe6",
    ink: "#3a2714",
  },
  mousserende: {
    deep: "#12160e",
    mid: "#5a6438",
    wine: "#d5dca6",
    foil: "#ead9a4",
    foilDeep: "#8a7340",
    paper: "#f6f1e2",
    ink: "#2c2416",
  },
  portvin: {
    deep: "#10060a",
    mid: "#3a1018",
    wine: "#5a1824",
    foil: "#2a2118",
    foilDeep: "#100e0c",
    paper: "#f1e3c4",
    ink: "#3a2714",
  },
  madeira: {
    deep: "#140a08",
    mid: "#5a3018",
    wine: "#8a4820",
    foil: "#c4a35a",
    foilDeep: "#5c4318",
    paper: "#f3e6c8",
    ink: "#3a2714",
  },
  sherry: {
    deep: "#16120c",
    mid: "#8a6830",
    wine: "#d4a24a",
    foil: "#c4a35a",
    foilDeep: "#6a5428",
    paper: "#f6edd8",
    ink: "#3a2714",
  },
  dessert: {
    deep: "#16100a",
    mid: "#7a5820",
    wine: "#e0b45a",
    foil: "#ead9a4",
    foilDeep: "#8a7340",
    paper: "#f8f0dc",
    ink: "#3a2714",
  },
  orange: {
    deep: "#160e08",
    mid: "#8a4e20",
    wine: "#e08838",
    foil: "#c4a35a",
    foilDeep: "#6a5428",
    paper: "#f6ead4",
    ink: "#3a2714",
  },
  anden: {
    deep: "#14120e",
    mid: "#5a4a34",
    wine: "#8a7050",
    foil: "#b89a5a",
    foilDeep: "#5c4a28",
    paper: "#f3ead8",
    ink: "#3a2714",
  },
};

type Geom = {
  body: string;
  foil: { x: number; y: number; w: number; h: number };
  label: { x: number; y: number; w: number; h: number };
  cage?: boolean;
};

const GEOM: Record<BottleShape, Geom> = {
  bordeaux: {
    body: "M52 36h16v40c8 6 22 16 22 30v158c0 12-12 20-30 20s-30-8-30-20V106c0-14 14-24 22-30V36z",
    foil: { x: 50, y: 14, w: 20, h: 26 },
    label: { x: 34, y: 128, w: 52, h: 84 },
  },
  burgundy: {
    body: "M54 30h12v40c18 22 28 36 28 62v128c0 14-14 22-34 22s-34-8-34-22V132c0-26 10-40 28-62V30z",
    foil: { x: 52, y: 12, w: 16, h: 24 },
    label: { x: 36, y: 146, w: 48, h: 74 },
  },
  champagne: {
    body: "M49 24h22v38c20 28 31 46 31 78v116c0 16-16 26-42 26S18 272 18 256V140c0-32 11-50 31-78V24z",
    foil: { x: 47, y: 8, w: 26, h: 40 },
    label: { x: 32, y: 152, w: 56, h: 76 },
    cage: true,
  },
  port: {
    body: "M55 16h10v88c22 14 33 36 33 72 0 48-8 78-16 90-8 12-16 16-22 16s-14-4-22-16c-8-12-16-42-16-90 0-36 11-58 33-72V16z",
    foil: { x: 53, y: 8, w: 14, h: 22 },
    label: { x: 38, y: 172, w: 44, h: 62 },
  },
  sherry: {
    body: "M56 10h8v104c16 12 26 28 26 52v86c0 14-12 22-30 22s-30-8-30-22v-86c0-24 10-40 26-52V10z",
    foil: { x: 54, y: 6, w: 12, h: 20 },
    label: { x: 40, y: 164, w: 40, h: 62 },
  },
};

type Props = {
  wineType?: WineType;
  imageUrl?: string;
  name?: string;
  vintage?: number;
  className?: string;
};

export function WineBottleSvg({
  wineType = "anden",
  imageUrl,
  name,
  vintage,
  className,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const glass = GLASS[wineType] ?? GLASS.anden;
  const geom = GEOM[bottleShape(wineType)];
  const copy = bottleLabelCopy(name ?? "", vintage);
  const { label } = geom;

  return (
    <svg viewBox="0 0 120 308" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={glass.deep} />
          <stop offset="16%" stopColor={glass.mid} />
          <stop offset="27%" stopColor="#fff6e4" stopOpacity="0.42" />
          <stop offset="38%" stopColor={glass.wine} />
          <stop offset="62%" stopColor={glass.mid} />
          <stop offset="100%" stopColor={glass.deep} />
        </linearGradient>
        <linearGradient id={`${uid}-falloff`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="42%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id={`${uid}-foil`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={glass.foilDeep} />
          <stop offset="32%" stopColor={glass.foil} />
          <stop offset="48%" stopColor="#f6edd4" />
          <stop offset="70%" stopColor={glass.foil} />
          <stop offset="100%" stopColor={glass.foilDeep} />
        </linearGradient>
        <clipPath id={`${uid}-body`}>
          <path d={geom.body} />
        </clipPath>
        <clipPath id={`${uid}-label`}>
          <rect x={label.x} y={label.y} width={label.w} height={label.h} rx="1.5" />
        </clipPath>
        <filter id={`${uid}-shadow`} x="-40%" y="-20%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <ellipse
        cx="60"
        cy="292"
        rx="26"
        ry="5"
        fill="rgba(0,0,0,0.55)"
        filter={`url(#${uid}-shadow)`}
      />

      <path d={geom.body} fill={`url(#${uid}-glass)`} />
      <path d={geom.body} fill={`url(#${uid}-falloff)`} />
      <path
        d="M46 78c2 18 3 48 2 92"
        fill="none"
        stroke="rgba(255,248,230,0.28)"
        strokeWidth="2.2"
        strokeLinecap="round"
        clipPath={`url(#${uid}-body)`}
      />
      <path
        d="M78 96c1 20 1 40 0 70"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1.4"
        strokeLinecap="round"
        clipPath={`url(#${uid}-body)`}
      />

      <rect
        x={geom.foil.x}
        y={geom.foil.y}
        width={geom.foil.w}
        height={geom.foil.h}
        rx="2"
        fill={`url(#${uid}-foil)`}
      />
      <rect
        x={geom.foil.x}
        y={geom.foil.y + geom.foil.h - 4}
        width={geom.foil.w}
        height="3"
        fill={glass.deep}
        opacity="0.45"
      />
      {geom.cage ? (
        <path
          d={`M${geom.foil.x + 2} ${geom.foil.y + geom.foil.h}c4 7 8 7 ${geom.foil.w - 4} 0`}
          fill="none"
          stroke={glass.foilDeep}
          strokeWidth="0.8"
        />
      ) : null}

      <g clipPath={`url(#${uid}-label)`}>
        <rect x={label.x} y={label.y} width={label.w} height={label.h} fill={glass.paper} />
        {imageUrl ? (
          <image
            href={imageUrl}
            x={label.x}
            y={label.y}
            width={label.w}
            height={label.h}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <LabelText geom={geom} copy={copy} ink={glass.ink} />
        )}
      </g>
      <rect
        x={label.x}
        y={label.y}
        width={label.w}
        height={label.h}
        rx="1.5"
        fill="none"
        stroke={glass.ink}
        strokeOpacity="0.28"
        strokeWidth="0.6"
      />
    </svg>
  );
}

function LabelText({
  geom,
  copy,
  ink,
}: {
  geom: Geom;
  copy: { lines: string[]; year: string | null };
  ink: string;
}) {
  const { label } = geom;
  const center = label.x + label.w / 2;
  const inner = label.w - 8;
  const hasYear = Boolean(copy.year);
  const start = label.y + (hasYear ? 18 : 24);

  return (
    <g>
      <rect
        x={label.x + 6}
        y={label.y + 6}
        width={label.w - 12}
        height="0.7"
        fill={ink}
        opacity="0.35"
      />
      {copy.lines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          x={center}
          y={start + index * 11}
          textAnchor="middle"
          fill={ink}
          fontFamily="Fraunces, Georgia, serif"
          fontSize="8.5"
          lengthAdjust={line.length > 10 ? "spacingAndGlyphs" : undefined}
          textLength={line.length > 10 ? inner : undefined}
        >
          {line}
        </text>
      ))}
      {copy.year ? (
        <text
          x={center}
          y={label.y + label.h - 12}
          textAnchor="middle"
          fill={ink}
          fontFamily="Manrope, sans-serif"
          fontSize="11"
          letterSpacing="0.6"
        >
          {copy.year}
        </text>
      ) : null}
    </g>
  );
}
