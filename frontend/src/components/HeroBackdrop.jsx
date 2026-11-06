import { useId } from "react";
import "./HeroBackdrop.css";

const bands = [-125, -106, -88, -71, -55, -40, -26, -13, 0, 13, 27, 42, 58, 75, 93, 112];

const points = [
  [468, 650], [520, 590], [560, 708], [606, 519], [664, 612], [685, 410],
  [725, 552], [757, 705], [787, 188], [821, 90], [852, 681], [922, 735],
  [974, 62], [1031, 656], [1108, 105], [1154, 709], [1219, 76], [1260, 634],
  [1317, 116], [1366, 215], [1388, 494], [1406, 565], [1433, 343], [1450, 128],
];

function contour(offset) {
  return `M -110 ${702 + offset * .44}
    C 152 ${795 + offset * .85}, 404 ${748 + offset}, 617 ${604 + offset}
    S 847 ${279 + offset * .68}, 1036 ${180 + offset * .76}
    S 1334 ${174 + offset * .69}, 1550 ${26 + offset * .6}`;
}

export default function HeroBackdrop() {
  const id = useId();
  const paint = (name) => `url(#${id}-${name})`;

  return (
    <div className="ls-hero-backdrop" aria-hidden="true">
      <div className="ls-hero-backdrop-mesh" />
      <div className="ls-hero-backdrop-grid" />
      <svg className="ls-hero-backdrop-art" viewBox="0 0 1440 760" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id={`${id}-silk`} x1="0%" y1="92%" x2="100%" y2="12%">
            <stop stopColor="#6688f1" stopOpacity="0" />
            <stop offset=".42" stopColor="#7d8ffc" stopOpacity=".19" />
            <stop offset=".7" stopColor="#5c8af3" stopOpacity=".13" />
            <stop offset="1" stopColor="#92b3ff" stopOpacity=".05" />
          </linearGradient>
          <linearGradient id={`${id}-wire`} gradientUnits="userSpaceOnUse" x1="100" y1="670" x2="1480" y2="65">
            <stop stopColor="#a1b6ff" stopOpacity="0" />
            <stop offset=".29" stopColor="#899cff" stopOpacity=".5" />
            <stop offset=".56" stopColor="#a6aaff" stopOpacity=".9" />
            <stop offset=".85" stopColor="#9bd2ff" stopOpacity=".75" />
            <stop offset="1" stopColor="#90c5ff" stopOpacity=".1" />
          </linearGradient>
          <radialGradient id={`${id}-spark`}>
            <stop stopColor="#c7dbff" stopOpacity=".75" />
            <stop offset=".3" stopColor="#9eb9ff" stopOpacity=".28" />
            <stop offset="1" stopColor="#8aabff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d="M-110 666 C152 706 404 651 617 514 S847 216 1036 112 S1334 100 1550 -36 L1550 105 C1334 242 1200 181 1036 251 S817 528 617 696 S152 874 -110 751Z" fill={paint("silk")} />
        <g fill="none" stroke={paint("wire")}>
          {bands.map((offset, index) => (
            <path key={offset} d={contour(offset)} strokeWidth={index % 5 === 0 ? 1.25 : .7} opacity={index % 5 === 0 ? .76 : .35} />
          ))}
          <path d="M 617 776 C 771 650 801 503 923 439 S 1152 420 1269 359 S 1423 208 1477 151" strokeWidth=".9" strokeDasharray="3 9" opacity=".5" />
        </g>
        <g className="ls-hero-traces" fill="none" strokeLinecap="round">
          <path d={contour(-40)} pathLength="100" />
          <path d={contour(27)} pathLength="100" />
          <path d={contour(75)} pathLength="100" />
        </g>
        <g className="ls-hero-constellation">
          {points.map(([x, y], index) => (
            <circle key={x} cx={x} cy={y} r={index % 6 === 0 ? 1.8 : .9} opacity={index % 3 === 0 ? .76 : .43} />
          ))}
          {[[664, 612], [1108, 105], [1388, 494]].map(([x, y]) => (
            <g key={x} transform={`translate(${x} ${y})`}>
              <circle r="15" fill={paint("spark")} />
              <path d="M-6 0H6M0-6V6" stroke="#b4cbff" strokeWidth=".65" />
              <circle r="1.9" fill="#e1ebff" />
            </g>
          ))}
        </g>
      </svg>
      <div className="ls-hero-backdrop-shade" />
    </div>
  );
}
