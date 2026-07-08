function toPlain(value) {
  if (!value) return value;
  if (typeof value.toJSON === 'function') return value.toJSON();
  return value;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  if (!value) return 'No definido';
  return new Intl.DateTimeFormat('es-DO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value));
}

function labelForType(type) {
  const labels = {
    student: 'Reporte de estudiante',
    group: 'Reporte de grupo',
    task: 'Reporte de tarea',
    final_grades: 'Reporte final de notas',
    instrument: 'Reporte de instrumento'
  };

  return labels[type] || 'Reporte';
}

function titleForReport(report) {
  const plainReport = toPlain(report);
  if (plainReport.student) return plainReport.student.name;
  if (plainReport.group) return plainReport.group.name;
  if (plainReport.task) return plainReport.task.title;
  if (plainReport.instrument) return plainReport.instrument.title;
  return labelForType(plainReport.type);
}

function gradeTone(value = 0) {
  const number = Number(value || 0);
  if (number >= 90) return 'excellent';
  if (number >= 80) return 'good';
  if (number >= 70) return 'fair';
  return 'low';
}

function renderGrade(value) {
  const number = Math.max(0, Math.min(100, Number(value || 0)));
  return `
    <div class="grade ${gradeTone(number)}">
      <strong>${escapeHtml(`${number}`)}</strong>
      <span><i style="width:${number}%"></i></span>
    </div>
  `;
}

function renderSummary(summary = {}) {
  const finalGrade = summary.finalGrade;
  const cards = [
    ['Evaluaciones', summary.count ?? 0],
    ['Promedio', `${summary.average ?? 0}`],
    ['Mayor nota', `${summary.highest ?? 0}`],
    ['Menor nota', `${summary.lowest ?? 0}`]
  ];

  if (finalGrade) {
    cards.push(['Nota final', `${finalGrade.grade}`], ['Método', finalGrade.method]);
  }

  return `
    <section class="summary" aria-label="Resumen">
      ${cards
        .map(
          ([label, value]) => `
            <article>
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </article>
          `
        )
        .join('')}
    </section>
  `;
}

function renderContext(report) {
  const chips = [];
  if (report.student?.email) chips.push(['Email', report.student.email]);
  if (report.group?.status) chips.push(['Estado del grupo', report.group.status]);
  if (report.task?.dueDate) chips.push(['Entrega', formatDate(report.task.dueDate)]);
  if (report.instrument?.type) chips.push(['Tipo', report.instrument.type]);
  if (report.instrument?.maxScore) chips.push(['Puntuación máxima', report.instrument.maxScore]);

  if (!chips.length) return '';

  return `
    <section class="context" aria-label="Datos del reporte">
      ${chips.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`).join('')}
    </section>
  `;
}

function renderEvaluations(evaluations = []) {
  if (!evaluations.length) return '<p class="empty">No hay evaluaciones publicadas para este reporte.</p>';

  return `
    <table>
      <thead>
        <tr>
          <th>Estudiante</th>
          <th>Tarea</th>
          <th>Instrumento</th>
          <th>Puntaje</th>
          <th>Nota final</th>
          <th>Publicada</th>
        </tr>
      </thead>
      <tbody>
        ${evaluations
          .map((evaluation) => {
            const item = toPlain(evaluation);
            return `
              <tr>
                <td>
                  <strong>${escapeHtml(item.student?.name || 'No definido')}</strong>
                  <small>${escapeHtml(item.student?.email || '')}</small>
                </td>
                <td>${escapeHtml(item.task?.title || 'Tarea sin título')}</td>
                <td>${escapeHtml(item.instrument?.title || 'No definido')}</td>
                <td>${escapeHtml(`${item.score ?? 0}/${item.maxScore ?? 0}`)}</td>
                <td>${renderGrade(item.percentage)}</td>
                <td>${escapeHtml(formatDate(item.publishedAt))}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

function renderFinalGrades(grades = []) {
  if (!grades.length) return '<p class="empty">No hay notas finales calculadas.</p>';

  return `
    <table>
      <thead>
        <tr>
          <th>Estudiante</th>
          <th>Email</th>
          <th>Nota final</th>
          <th>Método</th>
          <th>Evaluaciones</th>
        </tr>
      </thead>
      <tbody>
        ${grades
          .map((entry) => {
            const student = toPlain(entry.student);
            return `
              <tr>
                <td><strong>${escapeHtml(student?.name || 'No definido')}</strong></td>
                <td>${escapeHtml(student?.email || 'No definido')}</td>
                <td>${renderGrade(entry.finalGrade?.grade ?? 0)}</td>
                <td><span class="badge">${escapeHtml(entry.finalGrade?.method || 'none')}</span></td>
                <td>${escapeHtml(entry.finalGrade?.count ?? 0)}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

function renderStudents(students = []) {
  if (!students.length) return '';

  return `
    <section>
      <h2>Estudiantes</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Evaluaciones</th>
            <th>Nota final</th>
          </tr>
        </thead>
        <tbody>
          ${students
            .map((entry) => {
              const student = toPlain(entry.student);
              return `
                <tr>
                  <td><strong>${escapeHtml(student?.name || 'No definido')}</strong></td>
                  <td>${escapeHtml(student?.email || 'No definido')}</td>
                  <td>${escapeHtml(entry.summary?.count ?? 0)}</td>
                  <td>${renderGrade(entry.summary?.finalGrade?.grade ?? 0)}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </section>
  `;
}

export function renderReportHtml(report) {
  const plainReport = toPlain(report);
  const title = titleForReport(plainReport);

  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(labelForType(plainReport.type))}</title>
        <style>
          * { box-sizing: border-box; }
          :root {
            color-scheme: light;
            --ink: #172033;
            --muted: #5f6b7a;
            --line: #d8dee8;
            --soft: #f6f8fb;
            --accent: #155eef;
            --good: #0f766e;
            --fair: #b45309;
            --low: #b42318;
          }
          body {
            background: #ffffff;
            color: var(--ink);
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.45;
            margin: 0;
            padding: 32px;
          }
          header {
            border-bottom: 2px solid var(--ink);
            display: grid;
            gap: 12px;
            grid-template-columns: 1fr auto;
            margin-bottom: 20px;
            padding-bottom: 18px;
          }
          .brand {
            align-items: center;
            color: var(--accent);
            display: flex;
            font-size: 12px;
            font-weight: 700;
            gap: 6px;
            letter-spacing: 0;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .brand svg {
            flex-shrink: 0;
          }
          h1, h2 { margin: 0; }
          h1 {
            font-size: 26px;
            line-height: 1.15;
          }
          h2 {
            border-bottom: 1px solid var(--line);
            font-size: 17px;
            margin: 26px 0 12px;
            padding-bottom: 7px;
          }
          .subtitle {
            color: var(--muted);
            font-size: 14px;
            margin-top: 6px;
          }
          .stamp {
            border: 1px solid var(--line);
            border-radius: 6px;
            color: var(--muted);
            font-size: 12px;
            min-width: 148px;
            padding: 10px 12px;
            text-align: right;
          }
          .stamp strong {
            color: var(--ink);
            display: block;
            font-size: 13px;
            margin-top: 2px;
          }
          .context {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 16px 0 8px;
          }
          .context div {
            border: 1px solid var(--line);
            border-radius: 999px;
            font-size: 12px;
            padding: 7px 10px;
          }
          .context span { color: var(--muted); margin-right: 5px; }
          .summary {
            display: grid;
            gap: 10px;
            grid-template-columns: repeat(3, 1fr);
            margin: 18px 0 22px;
          }
          .summary article {
            background: var(--soft);
            border: 1px solid var(--line);
            border-radius: 6px;
            padding: 12px;
          }
          .summary span {
            color: var(--muted);
            display: block;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .summary strong { font-size: 21px; }
          table {
            border-collapse: collapse;
            margin-top: 10px;
            width: 100%;
          }
          th, td {
            border-bottom: 1px solid var(--line);
            font-size: 12px;
            padding: 9px 8px;
            text-align: left;
            vertical-align: middle;
          }
          th {
            background: var(--soft);
            color: #344054;
            font-size: 11px;
            text-transform: uppercase;
          }
          tbody tr:nth-child(even) td { background: #fbfcfe; }
          td small {
            color: var(--muted);
            display: block;
            font-size: 11px;
            margin-top: 2px;
          }
          .badge {
            background: #eef4ff;
            border: 1px solid #b2ccff;
            border-radius: 999px;
            color: #1849a9;
            display: inline-block;
            font-size: 11px;
            padding: 3px 8px;
          }
          .grade {
            align-items: center;
            display: grid;
            gap: 6px;
            grid-template-columns: 44px minmax(60px, 1fr);
          }
          .grade strong { font-size: 12px; }
          .grade span {
            background: #edf0f5;
            border-radius: 999px;
            display: block;
            height: 7px;
            overflow: hidden;
          }
          .grade i {
            background: var(--accent);
            display: block;
            height: 100%;
          }
          .grade.good i, .grade.excellent i { background: var(--good); }
          .grade.fair i { background: var(--fair); }
          .grade.low i { background: var(--low); }
          .empty {
            background: var(--soft);
            border: 1px dashed var(--line);
            border-radius: 6px;
            color: var(--muted);
            padding: 14px;
          }
          footer {
            border-top: 1px solid var(--line);
            color: var(--muted);
            font-size: 11px;
            margin-top: 28px;
            padding-top: 10px;
          }
          @page { margin: 14mm; }
          @media print {
            body { padding: 0; }
            header, .summary article, .context div, .empty { break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <header>
          <div>
            <div class="brand">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" aria-hidden="true">
                <rect width="512" height="512" rx="115" fill="#2F6F4E"/>
                <rect x="98" y="98" width="148" height="148" rx="30" fill="#FFFFFF" opacity="0.19"/>
                <rect x="266" y="98" width="148" height="148" rx="30" fill="#FFFFFF" opacity="0.28"/>
                <rect x="98" y="266" width="148" height="148" rx="30" fill="#FFFFFF" opacity="0.14"/>
                <rect x="266" y="266" width="148" height="148" rx="30" fill="#FFFFFF" opacity="0.19"/>
                <path d="M150 274 L232 354 L374 156" fill="none" stroke="#FFFFFF" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              EvalúaPro
            </div>
            <h1>${escapeHtml(labelForType(plainReport.type))}</h1>
            <div class="subtitle">${escapeHtml(title)}</div>
          </div>
          <div class="stamp">
            Generado
            <strong>${escapeHtml(formatDate(plainReport.generatedAt))}</strong>
          </div>
        </header>
        ${renderContext(plainReport)}
        ${plainReport.summary ? renderSummary(plainReport.summary) : ''}
        ${plainReport.grades ? `<section><h2>Notas finales</h2>${renderFinalGrades(plainReport.grades)}</section>` : ''}
        ${plainReport.students ? renderStudents(plainReport.students) : ''}
        ${
          plainReport.evaluations
            ? `<section><h2>Evaluaciones publicadas</h2>${renderEvaluations(plainReport.evaluations)}</section>`
            : ''
        }
        <footer>Reporte generado automáticamente por EvalúaPro.</footer>
      </body>
    </html>`;
}
