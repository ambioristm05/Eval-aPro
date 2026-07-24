import ExcelJS from 'exceljs';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-DO');
}

function buildReportTable(report) {
  if (report.type === 'final_grades') {
    return {
      headers: ['Estudiante', 'Correo', 'Nota final', 'Método', 'Evaluaciones'],
      rows: (report.grades ?? []).map((entry) => [
        entry.student?.name ?? '',
        entry.student?.email ?? '',
        entry.finalGrade?.grade ?? '',
        entry.finalGrade?.method ?? '',
        entry.finalGrade?.count ?? 0
      ])
    };
  }

  return {
    headers: ['Estudiante', 'Correo', 'Tarea', 'Instrumento', 'Puntaje', 'Nota máxima', 'Porcentaje', 'Publicada'],
    rows: (report.evaluations ?? []).map((evaluation) => [
      evaluation.student?.name ?? '',
      evaluation.student?.email ?? '',
      evaluation.task?.title ?? '',
      evaluation.instrument?.title ?? '',
      evaluation.score ?? '',
      evaluation.maxScore ?? '',
      evaluation.percentage != null ? `${evaluation.percentage}%` : '',
      formatDate(evaluation.publishedAt)
    ])
  };
}

function buildStudentSummaryTable(report) {
  return {
    headers: ['Estudiante', 'Correo', 'Evaluaciones', 'Nota final'],
    rows: (report.students ?? []).map((entry) => [
      entry.student?.name ?? '',
      entry.student?.email ?? '',
      entry.summary?.count ?? 0,
      entry.summary?.finalGrade?.grade ?? ''
    ])
  };
}

function escapeCsvValue(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function renderReportCsv(report) {
  const { headers, rows } = buildReportTable(report);
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(','));
  return lines.join('\r\n');
}

function writeSheet(workbook, name, headers, rows) {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  sheet.columns.forEach((column) => {
    column.width = 22;
  });
}

export async function renderReportXlsx(report) {
  const workbook = new ExcelJS.Workbook();
  const { headers, rows } = buildReportTable(report);

  if (report.type === 'group') {
    const summary = buildStudentSummaryTable(report);
    writeSheet(workbook, 'Resumen por estudiante', summary.headers, summary.rows);
    writeSheet(workbook, 'Evaluaciones', headers, rows);
  } else {
    writeSheet(workbook, 'Reporte', headers, rows);
  }

  return workbook.xlsx.writeBuffer();
}
