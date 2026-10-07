const axes = [
  { label: "Daring", angle: -90, value: 3.2 },
  { label: "Bluffing", angle: -18, value: 1.5 },
  { label: "Push", angle: 54, value: 2.6 },
  { label: "Fold", angle: 126, value: 1 },
  { label: "Bold", angle: 198, value: 4.5 },
];

const center = 150;
const radius = 105;

function point(angle: number, distance: number) {
  const radians = (angle * Math.PI) / 180;
  return [
    center + Math.cos(radians) * distance,
    center + Math.sin(radians) * distance,
  ];
}

function polygonPoints(scale: number) {
  return axes.map(({ angle }) => point(angle, radius * scale).join(",")).join(" ");
}

const dataPoints = axes
  .map(({ angle, value }) => point(angle, radius * (value / 5)).join(","))
  .join(" ");

export default function RadarChart() {
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="Poker playstyle radar chart" className="h-auto w-full max-w-[440px]">
      {[1, 0.75, 0.5, 0.25].map((scale) => (
        <polygon key={scale} points={polygonPoints(scale)} fill="none" stroke="#71717a" strokeWidth="1" />
      ))}
      {axes.map(({ angle, label }) => {
        const [x, y] = point(angle, radius);
        const [labelX, labelY] = point(angle, radius + 25);
        return (
          <g key={label}>
            <line x1={center} y1={center} x2={x} y2={y} stroke="#71717a" strokeWidth="1" />
            <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="700">
              {label}
            </text>
          </g>
        );
      })}
      <polygon points={dataPoints} fill="rgba(254, 220, 110, 0.35)" stroke="#fedc6e" strokeWidth="3" />
      {axes.map(({ angle, label, value }) => {
        const [x, y] = point(angle, radius * (value / 5));
        return <circle key={label} cx={x} cy={y} r="4" fill="#fedc6e" />;
      })}
    </svg>
  );
}
