const SCORE_BUCKETS = [
  { key: '0-59', label: '0 – 59', colorClass: 'score-bar-fill-danger' },
  { key: '60-69', label: '60 – 69', colorClass: 'score-bar-fill-warning' },
  { key: '70-79', label: '70 – 79', colorClass: 'score-bar-fill-neutral' },
  { key: '80-89', label: '80 – 89', colorClass: 'score-bar-fill-primary' },
  { key: '90-100', label: '90 – 100', colorClass: 'score-bar-fill-success' },
];

function ScoreBarChart({ distribution = {} }) {
  const counts = SCORE_BUCKETS.map(({ key }) => distribution[key] ?? 0);
  const max = Math.max(...counts, 1);

  return (
    <div className="score-bar-chart">
      {SCORE_BUCKETS.map(({ key, label, colorClass }, i) => (
        <div className="score-bar-row" key={key}>
          <span className="score-bar-label">{label}</span>
          <div className="score-bar-track">
            <div
              className={`score-bar-fill ${colorClass}`}
              style={{ width: `${(counts[i] / max) * 100}%` }}
            />
          </div>
          <span className="score-bar-count">{counts[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default ScoreBarChart;
