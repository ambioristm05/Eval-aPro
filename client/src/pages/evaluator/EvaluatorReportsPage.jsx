import { Download, Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  getPrintableReport,
  getReport,
  listResource,
  updateStudentReportPermission,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { openPrintableHtml } from '../../utils/printReport.js';

const reportTitles = {
  student: 'Reporte individual',
  group: 'Reporte por grupo',
  task: 'Reporte por tarea',
  final: 'Reporte final',
  instrument: 'Reporte por instrumento',
};

function getId(resource) {
  return resource?.id ?? resource?._id ?? '';
}

function getStudentName(evaluation) {
  return evaluation.student?.name ?? 'Estudiante';
}

function getTaskTitle(evaluation) {
  return evaluation.task?.title ?? 'Tarea';
}

function getInstrumentTitle(evaluation) {
  return evaluation.instrument?.title ?? 'Instrumento';
}

function getGradeValue(value) {
  if (value && typeof value === 'object') {
    return Number(value.grade ?? value.average ?? 0);
  }

  return Number(value ?? 0);
}

function formatPercent(value) {
  const numericValue = getGradeValue(value);
  return `${Number.isFinite(numericValue) ? numericValue : 0}%`;
}

function getSummaryValue(report) {
  return report?.summary?.finalGrade ?? report?.summary?.average ?? 0;
}

function EvaluatorReportsPage() {
  const [reportType, setReportType] = useState('student');
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [selectedIds, setSelectedIds] = useState({
    student: '',
    group: '',
    task: '',
    final: '',
    instrument: '',
  });
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPermission, setIsUpdatingPermission] = useState(false);

  const activeOptions = useMemo(() => {
    if (reportType === 'student') return students;
    if (reportType === 'group' || reportType === 'final') return groups;
    if (reportType === 'task') return tasks;
    if (reportType === 'instrument') return instruments;
    return [];
  }, [groups, instruments, reportType, students, tasks]);

  const selectedId = reportType === 'final' ? selectedIds.final || selectedIds.group : selectedIds[reportType];
  const evaluations = report?.evaluations ?? [];
  const summaryValue = getSummaryValue(report);
  const studentPrintEnabled = Boolean(report?.permissions?.studentPrintEnabled);

  useEffect(() => {
    let isMounted = true;

    async function fetchCatalogs() {
      setIsLoading(true);
      setError('');
      setMessage('');

      try {
        const [studentsData, groupsData, tasksData, instrumentsData] = await Promise.all([
          listResource('students', { limit: 100 }),
          listResource('groups', { limit: 100 }),
          listResource('tasks', { limit: 100 }),
          listResource('instruments', { limit: 100 }),
        ]);

        if (!isMounted) return;

        const nextStudents = studentsData.students ?? [];
        const nextGroups = groupsData.groups ?? [];
        const nextTasks = tasksData.tasks ?? [];
        const nextInstruments = instrumentsData.instruments ?? [];

        setStudents(nextStudents);
        setGroups(nextGroups);
        setTasks(nextTasks);
        setInstruments(nextInstruments);
        setSelectedIds({
          student: nextStudents[0] ? getId(nextStudents[0]) : '',
          group: nextGroups[0] ? getId(nextGroups[0]) : '',
          final: nextGroups[0] ? getId(nextGroups[0]) : '',
          task: nextTasks[0] ? getId(nextTasks[0]) : '',
          instrument: nextInstruments[0] ? getId(nextInstruments[0]) : '',
        });
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchCatalogs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      if (!selectedId) {
        setReport(null);
        return;
      }

      setError('');

      try {
        const nextReport = await getReport(reportType, selectedId);
        if (!isMounted) return;
        setReport(nextReport);
      } catch (requestError) {
        if (!isMounted) return;
        setReport(null);
        setError(getErrorMessage(requestError));
      }
    }

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [reportType, selectedId]);

  const handleReportTypeChange = (event) => {
    const nextType = event.target.value;
    setReportType(nextType);
    setMessage('');
  };

  const handleSelectedIdChange = (event) => {
    const value = event.target.value;
    setMessage('');
    setSelectedIds((current) => ({
      ...current,
      [reportType]: value,
      ...(reportType === 'group' ? { final: value } : {}),
      ...(reportType === 'final' ? { group: value } : {}),
    }));
  };

  const refreshCurrentReport = async () => {
    if (!selectedId) return;
    const nextReport = await getReport(reportType, selectedId);
    setReport(nextReport);
  };

  const handlePrintPermission = async (enabled) => {
    if (reportType !== 'student' || !selectedId) return;

    setError('');
    setMessage('');
    setIsUpdatingPermission(true);

    try {
      const result = await updateStudentReportPermission(selectedId, enabled);
      setMessage(result.message);
      await refreshCurrentReport();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsUpdatingPermission(false);
    }
  };

  const handleOpenPrintableReport = async () => {
    if (!report || !selectedId) return;

    setError('');
    setMessage('');

    try {
      const html = await getPrintableReport(reportType, selectedId);
      openPrintableHtml(html);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <section className="management-page">
      <div className="module-hero no-print">
        <span className="module-hero-icon">
          <Printer size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>Reportes</h1>
          <p className="dashboard-description">
            Genera vistas imprimibles de resultados individuales, grupos, tareas e instrumentos.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error no-print">{error}</p> : null}
      {message ? <p className="form-message form-message-success no-print">{message}</p> : null}

      <div className="dashboard-panel no-print">
        <div className="toolbar toolbar-wide">
          <select className="filter-select" value={reportType} onChange={handleReportTypeChange}>
            <option value="student">Individual</option>
            <option value="group">Por grupo</option>
            <option value="task">Por tarea</option>
            <option value="final">Final de notas</option>
            <option value="instrument">Por instrumento</option>
          </select>
          <select className="filter-select" value={selectedId} onChange={handleSelectedIdChange} disabled={!activeOptions.length}>
            {activeOptions.map((option) => (
              <option value={getId(option)} key={getId(option)}>
                {option.name ?? option.title}
              </option>
            ))}
          </select>
          <button className="button button-primary" type="button" onClick={handleOpenPrintableReport} disabled={!report}>
            <Printer size={18} aria-hidden="true" />
            Imprimir
          </button>
        </div>

        {reportType === 'student' ? (
          <div className="form-actions">
            <button
              className={studentPrintEnabled ? 'button button-secondary' : 'button button-primary'}
              type="button"
              onClick={() => handlePrintPermission(!studentPrintEnabled)}
              disabled={!report || isUpdatingPermission || !evaluations.length}
            >
              {studentPrintEnabled ? 'Bloquear impresion al estudiante' : 'Permitir impresion al estudiante'}
            </button>
            <span className={`status-badge ${studentPrintEnabled ? 'status-published' : 'status-pending'}`}>
              {studentPrintEnabled ? 'Permitido para estudiante' : 'No permitido'}
            </span>
          </div>
        ) : null}
      </div>

      <section className="print-sheet">
        <header className="print-header">
          <div>
            <p className="eyebrow">EvaluaPro</p>
            <h1>{reportTitles[reportType]}</h1>
            <p>{report?.generatedAt ? new Date(report.generatedAt).toLocaleDateString('es-DO') : new Date().toLocaleDateString('es-DO')}</p>
          </div>
          <strong>{formatPercent(summaryValue)}</strong>
        </header>

        {reportType === 'final' ? (
          <table className="report-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Nota final</th>
              </tr>
            </thead>
            <tbody>
              {(report?.grades ?? []).map((grade) => (
                <tr key={getId(grade.student)}>
                  <td>{grade.student?.name ?? 'Estudiante'}</td>
                  <td>{formatPercent(grade.finalGrade)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
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
              {evaluations.map((evaluation) => (
                <tr key={getId(evaluation)}>
                  <td>{getStudentName(evaluation)}</td>
                  <td>{getTaskTitle(evaluation)}</td>
                  <td>{getInstrumentTitle(evaluation)}</td>
                  <td>{evaluation.score}/{evaluation.maxScore}</td>
                  <td>{evaluation.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {isLoading ? (
          <div className="report-notes">
            <p>Cargando datos reales...</p>
          </div>
        ) : null}

        <div className="report-notes">
          <h2>Retroalimentacion</h2>
          {evaluations.map((evaluation) => (
            <p key={`${getId(evaluation)}-feedback`}>
              <strong>{getTaskTitle(evaluation)}:</strong> {evaluation.feedback || 'Sin retroalimentacion registrada.'}
            </p>
          ))}
          {!evaluations.length && reportType !== 'final' ? <p>No hay evaluaciones publicadas para este reporte.</p> : null}
        </div>
      </section>

      <button className="floating-print no-print" type="button" onClick={handleOpenPrintableReport} title="Imprimir" disabled={!report}>
        <Download size={20} aria-hidden="true" />
      </button>
    </section>
  );
}

export default EvaluatorReportsPage;
