import type { SVGProps } from 'react'

// Kid traffic-savvy — adult + kid riding in a painted bike lane with
// a car in the adjacent traffic lane, separated by the dashed lane
// stripe. Top-down-ish two-lane composition: car above the dashes,
// bikes below. Signals that at this level the rider shares the road
// with cars, separated only by paint.
export function KidTrafficSavvy(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="48"
      height="22"
      viewBox="0 0 80 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Car in upper lane */}
      <path d="M34 15 L37 6 L60 6 L63 15 Z" strokeWidth="1.4" />
      <line x1="33" y1="15" x2="64" y2="15" strokeWidth="1.4" />
      {/* Windows */}
      <line x1="42" y1="6"  x2="42" y2="15" strokeWidth="1.2" />
      <line x1="55" y1="6"  x2="55" y2="15" strokeWidth="1.2" />
      {/* Car wheels */}
      <circle cx="40" cy="17" r="2"  strokeWidth="1.3" />
      <circle cx="57" cy="17" r="2"  strokeWidth="1.3" />

      {/* Painted bike lane dashes across the middle */}
      <line x1="2"  y1="20" x2="8"  y2="20" strokeWidth="1.4" />
      <line x1="12" y1="20" x2="18" y2="20" strokeWidth="1.4" />
      <line x1="22" y1="20" x2="28" y2="20" strokeWidth="1.4" />
      <line x1="32" y1="20" x2="38" y2="20" strokeWidth="1.4" />
      <line x1="42" y1="20" x2="48" y2="20" strokeWidth="1.4" />
      <line x1="52" y1="20" x2="58" y2="20" strokeWidth="1.4" />
      <line x1="62" y1="20" x2="68" y2="20" strokeWidth="1.4" />
      <line x1="72" y1="20" x2="78" y2="20" strokeWidth="1.4" />

      {/* Adult bike in the bike lane (below the dashes) */}
      <circle cx="10" cy="31" r="4" strokeWidth="1.5" />
      <circle cx="23" cy="31" r="4" strokeWidth="1.5" />
      <path d="M10 31 L16 31 L14 25 Z" strokeWidth="1.3" />
      <path d="M14 25 L19.5 25 L23 31" strokeWidth="1.3" />
      <line x1="19.5" y1="25" x2="16" y2="31" strokeWidth="1.3" />
      <line x1="11.5" y1="25" x2="16" y2="25" strokeWidth="1.3" />
      <line x1="18" y1="23.5" x2="21.5" y2="23.5" strokeWidth="1.3" />
      {/* Adult rider */}
      <circle cx="17" cy="22" r="1.5" strokeWidth="1.3" />
      <line x1="17" y1="23.5" x2="16" y2="25" strokeWidth="1.3" />
      <line x1="17" y1="23.7" x2="19.5" y2="25" strokeWidth="1.3" />

      {/* Kid bike behind/beside the adult */}
      <circle cx="36" cy="31" r="3" strokeWidth="1.3" />
      <circle cx="46" cy="31" r="3" strokeWidth="1.3" />
      <path d="M36 31 L41 31 L39.5 26 Z" strokeWidth="1.2" />
      <path d="M39.5 26 L43.5 26 L46 31" strokeWidth="1.2" />
      <line x1="43.5" y1="26" x2="41" y2="31" strokeWidth="1.2" />
      <line x1="37.5" y1="26" x2="41" y2="26" strokeWidth="1.2" />
      <line x1="42" y1="24.5" x2="45" y2="24.5" strokeWidth="1.2" />
      {/* Kid rider */}
      <circle cx="41.5" cy="23" r="1.2" strokeWidth="1.2" />
      <line x1="41.5" y1="24.2" x2="41" y2="26" strokeWidth="1.2" />
      <line x1="41.5" y1="24.4" x2="43.5" y2="26" strokeWidth="1.2" />
    </svg>
  )
}
