const labels = [
  ["Daring", 150, 18],
  ["Bluffing", 280, 112],
  ["Push", 235, 278],
  ["Fold", 66, 278],
  ["Bold", 18, 112],
] as const;

export default function RadarChart() {
  return (
    <svg
      className="radar-chart"
      viewBox="0 0 300 300"
      role="img"
      aria-label="Playstyle radar chart"
    >
      {[45, 75, 105, 135].map((radius) => (
        <polygon
          key={radius}
          points={pentagon(radius)}
          fill="none"
          stroke="#777"
          strokeWidth="1"
        />
      ))}
      {[0, 1, 2, 3, 4].map((index) => {
        const point = polar(135, index);
        return (
          <line
            key={index}
            x1="150"
            y1="150"
            x2={point.x}
            y2={point.y}
            stroke="#777"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={[3.2, 1.5, 2.6, 1, 4.5]
          .map((value, index) => {
            const point = polar(value * 27, index);
            return `${point.x},${point.y}`;
          })
          .join(" ")}
        fill="rgba(254, 220, 110, 0.55)"
        stroke="#fedc6e"
        strokeWidth="3"
      />
      {labels.map(([label, x, y]) => (
        <text
          key={label}
          x={x}
          y={y}
          fill="white"
          fontSize="15"
          fontWeight="bold"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function polar(radius: number, index: number) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / 5;
  return {
    x: 150 + radius * Math.cos(angle),
    y: 150 + radius * Math.sin(angle),
  };
}

function pentagon(radius: number) {
  return [0, 1, 2, 3, 4]
    .map((index) => {
      const point = polar(radius, index);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}
