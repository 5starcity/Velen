'use client';

/**
 * CompatibilityRing
 * Renders the overall match score as a segmented ring — one arc per
 * category (sleep, cleanliness, budget, etc). Shape communicates *why*
 * two people match, not just how much.
 *
 * segments: [{ label: 'Sleep schedule', score: 0-1 }, ...]
 * overallScore: 0-100
 */
export default function CompatibilityRing({ segments, overallScore, size = 88 }) {
  const strokeWidth = 6;
  const gap = 0.06; // radians of gap between segments
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const total = segments.length;
  const anglePer = (2 * Math.PI - gap * total) / total;

  let currentAngle = -Math.PI / 2; // start at top

  const arcs = segments.map((seg) => {
    const startAngle = currentAngle;
    const endAngle = currentAngle + anglePer * Math.max(seg.score, 0.04);
    currentAngle += anglePer + gap;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return {
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      label: seg.label,
    };
  });

  // Track (background) arcs for each segment slot, full-length, faint
  let trackAngle = -Math.PI / 2;
  const tracks = segments.map(() => {
    const startAngle = trackAngle;
    const endAngle = trackAngle + anglePer;
    trackAngle += anglePer + gap;
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  });

  return (
    <div className="compat-ring" style={{ width: size, height: size }}>
      <svg
        className="compat-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${overallScore} percent compatibility match`}
      >
        {tracks.map((d, i) => (
          <path
            key={`track-${i}`}
            d={d}
            className="compat-ring__track"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {arcs.map((arc, i) => (
          <path
            key={`arc-${i}`}
            d={arc.path}
            className="compat-ring__arc"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="compat-ring__center">
        <span className="compat-ring__score">{overallScore}</span>
        <span className="compat-ring__percent">%</span>
      </div>
    </div>
  );
}