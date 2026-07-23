export const mockStudents = [
  {
    id: 'student-ana',
    name: 'Ana Martinez',
    email: 'ana.martinez@correo.com',
    group: 'Literatura 4to A',
  },
  {
    id: 'student-carlos',
    name: 'Carlos Jimenez',
    email: 'carlos.jimenez@correo.com',
    group: 'Proyecto final 5to B',
  },
  {
    id: 'student-lucia',
    name: 'Lucia Perez',
    email: 'lucia.perez@correo.com',
    group: 'Práctica de observación',
  },
];

export const mockTasks = [
  {
    id: 'task-reading-analysis',
    title: 'Analisis de cuento latinoamericano',
    group: 'Literatura 4to A',
    weight: 20,
  },
  {
    id: 'task-final-presentation',
    title: 'Presentación del proyecto final',
    group: 'Proyecto final 5to B',
    weight: 35,
  },
  {
    id: 'task-observation-guide',
    title: 'Práctica de observación',
    group: 'Práctica de observación',
    weight: 15,
  },
];

export const mockInstruments = [
  {
    id: 'instrument-reading-rubric',
    title: 'Rúbrica analítica de lectura',
    type: 'rubric',
    criteria: [
      { id: 'c1', name: 'Comprensión del tema', maxScore: 5 },
      { id: 'c2', name: 'Organización', maxScore: 5 },
      { id: 'c3', name: 'Evidencia', maxScore: 5 },
      { id: 'c4', name: 'Argumentación', maxScore: 5 },
    ],
  },
  {
    id: 'instrument-presentation-scale',
    title: 'Escala de presentación oral',
    type: 'rating_scale',
    criteria: [
      { id: 'c1', name: 'Dominio del tema', maxScore: 5 },
      { id: 'c2', name: 'Claridad verbal', maxScore: 5 },
      { id: 'c3', name: 'Recursos visuales', maxScore: 5 },
      { id: 'c4', name: 'Manejo del tiempo', maxScore: 5 },
    ],
  },
];

export const mockEvaluations = [
  {
    id: 'evaluation-ana-reading',
    student: 'Ana Martinez',
    group: 'Literatura 4to A',
    task: 'Analisis de cuento latinoamericano',
    instrument: 'Rúbrica analítica de lectura',
    score: 18,
    maxScore: 20,
    percentage: 90,
    status: 'published',
    evaluatedAt: '2026-06-28',
    feedback: 'Buen analisis y uso pertinente de evidencias.',
    strengths: ['Identifica ideas centrales', 'Usa ejemplos concretos'],
    improvements: ['Profundizar la conclusión'],
    suggestions: ['Revisa conectores lógicos para mejorar la fluidez.'],
    criteria: [
      { name: 'Comprensión del tema', score: 5, maxScore: 5 },
      { name: 'Organización', score: 4, maxScore: 5 },
      { name: 'Evidencia', score: 5, maxScore: 5 },
      { name: 'Argumentación', score: 4, maxScore: 5 },
    ],
  },
  {
    id: 'evaluation-ana-presentation',
    student: 'Ana Martinez',
    group: 'Literatura 4to A',
    task: 'Presentación del proyecto final',
    instrument: 'Escala de presentación oral',
    score: 16,
    maxScore: 20,
    percentage: 80,
    status: 'published',
    evaluatedAt: '2026-06-20',
    feedback: 'Presentación clara, con buen dominio del contenido.',
    strengths: ['Comunica ideas con claridad'],
    improvements: ['Cuidar el manejo del tiempo'],
    suggestions: ['Práctica con cronómetro antes de la exposicion final.'],
    criteria: [
      { name: 'Dominio del tema', score: 5, maxScore: 5 },
      { name: 'Claridad verbal', score: 4, maxScore: 5 },
      { name: 'Recursos visuales', score: 4, maxScore: 5 },
      { name: 'Manejo del tiempo', score: 3, maxScore: 5 },
    ],
  },
];

export function calculateAverage(evaluations) {
  if (!evaluations.length) return 0;
  return Math.round(
    evaluations.reduce((total, evaluation) => total + evaluation.percentage, 0) / evaluations.length,
  );
}
