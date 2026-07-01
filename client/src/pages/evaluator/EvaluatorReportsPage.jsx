import { Download, Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { calculateAverage, mockEvaluations, mockStudents } from '../../data/mockAcademicData.js';

function EvaluatorReportsPage() {
  const [reportType, setReportType] = useState('student');
  const [studentName, setStudentName] = useState('Ana Martinez');

  const reportEvaluations = useMemo(() => {
    if (reportType === 'student') {
      return mockEvaluations.filter((evaluation) => evaluation.student === studentName);
    }
    return mockEvaluations;
  }, [reportType, studentName]);

  const average = calculateAverage(reportEvaluations);

  return (
    <section className="management-page">
      <div className="module-hero no-print">
        <span className="module-hero-icon"><Printer size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>Reportes</h1>
          <p className="dashboard-description">
            Genera vistas imprimibles de resultados individuales, grupos y nota final.
          </p>
        </div>
      </div>

      <div className="dashboard-panel no-print">
        <div className="toolbar toolbar-wide">
          <select className="filter-select" value={reportType} onChange={(event) => setReportType(event.target.value)}>
            <option value="student">Individual</option>
            <option value="group">Por grupo</option>
            <option value="final">Final de notas</option>
          </select>
          <select className="filter-select" value={studentName} onChange={(event) => setStudentName(event.target.value)} disabled={reportType !== 'student'}>
            {mockStudents.map((student) => (
              <option value={student.name} key={student.id}>{student.name}</option>
            ))}
          </select>
          <button className="button button-primary" type="button" onClick={() => window.print()}>
            <Printer size={18} aria-hidden="true" />
            Imprimir
          </button>
        </div>
      </div>

      <section className="print-sheet">
        <header className="print-header">
          <div>
            <p className="eyebrow">EvaluaPro</p>
            <h1>{reportType === 'student' ? 'Reporte individual' : reportType === 'group' ? 'Reporte por grupo' : 'Reporte final'}</h1>
            <p>{new Date().toLocaleDateString('es-DO')}</p>
          </div>
          <strong>{average}%</strong>
        </header>

        <table className="report-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Tarea</th>
              <th>Instrumento</th>
              <th>Nota</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {reportEvaluations.map((evaluation) => (
              <tr key={evaluation.id}>
                <td>{evaluation.student}</td>
                <td>{evaluation.task}</td>
                <td>{evaluation.instrument}</td>
                <td>{evaluation.score}/{evaluation.maxScore}</td>
                <td>{evaluation.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="report-notes">
          <h2>Retroalimentacion</h2>
          {reportEvaluations.map((evaluation) => (
            <p key={`${evaluation.id}-feedback`}><strong>{evaluation.task}:</strong> {evaluation.feedback}</p>
          ))}
        </div>
      </section>

      <button className="floating-print no-print" type="button" onClick={() => window.print()} title="Imprimir">
        <Download size={20} aria-hidden="true" />
      </button>
    </section>
  );
}

export default EvaluatorReportsPage;
