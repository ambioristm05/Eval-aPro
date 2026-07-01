export function calculatePercentage(score = 0, maxScore = 0) {
  if (!maxScore) return 0;
  return Math.round((Number(score) / Number(maxScore)) * 10000) / 100;
}

export function calculateFinalGrade(evaluations = []) {
  const published = evaluations.filter((evaluation) => evaluation.status === 'published');
  if (!published.length) return { grade: 0, method: 'none', count: 0 };

  const weighted = published.filter((evaluation) => Number(evaluation.task?.weight) > 0);
  const totalWeight = weighted.reduce((sum, evaluation) => sum + Number(evaluation.task.weight), 0);

  if (weighted.length && totalWeight > 0) {
    const grade = weighted.reduce((sum, evaluation) => {
      return sum + Number(evaluation.percentage || 0) * (Number(evaluation.task.weight) / totalWeight);
    }, 0);
    return { grade: Math.round(grade * 100) / 100, method: 'weighted', count: published.length };
  }

  const grade = published.reduce((sum, evaluation) => sum + Number(evaluation.percentage || 0), 0) / published.length;
  return { grade: Math.round(grade * 100) / 100, method: 'simple', count: published.length };
}
