import { Download, Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTimedState } from '../../hooks/useTimedState.js';
import {
  getPdfReport,
  getPrintableReport,
  getReport,
  listCourseModules,
  listModuleClasses,
  listResource,
  updateStudentReportPermission,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';
import { openPrintableHtml } from '../../utils/printReport.js';

const reportTitles = {
  student: 'Reporte individual',
  group: 'Reporte por grupo',
  task: 'Reporte por tarea',
  final: 'Reporte final',
  instrument: 'Reporte por instrumento',
};

function getStudentName(evaluation) {
  return evaluation.student?.name ?? 'Estudiante';
}

function getTaskTitle(evaluation, report) {
  return evaluation.task?.title ?? report?.task?.title ?? 'Tarea sin título';
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

function formatGrade(value) {
  const numericValue = getGradeValue(value);
  return `${Number.isFinite(numericValue) ? numericValue : 0}`;
}

function getSummaryValue(report) {
  return report?.summary?.finalGrade ?? report?.summary?.average ?? 0;
}

function cleanHierarchyParams(filter) {
  return Object.fromEntries(Object.entries(filter).filter(([, value]) => Boolean(value)));
}

function EvaluatorReportsPage() {
  const [reportType, setReportType] = useState('student');
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [hierarchyModules, setHierarchyModules] = useState([]);
  const [hierarchyClasses, setHierarchyClasses] = useState([]);
  const [hierarchyFilter, setHierarchyFilter] = useState({ courseId: '', moduleId: '', classId: '' });
  const [selectedIds, setSelectedIds] = useState({
    student: '',
    group: '',
    task: '',
    final: '',
    instrument: '',
  });
  const [report, setReport] = useState(null);
  const [error, setError] = useTimedState();
  const [message, setMessage] = useTimedState();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPermission, setIsUpdatingPermission] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isHierarchyFilterActive = Boolean(
    hierarchyFilter.courseId || hierarchyFilter.moduleId || hierarchyFilter.classId
  );

  // Cuando hay filtro de jerarquía activo, `hierarchyScopedTasks` trae la lista ya
  // acotada por el servidor (ver el useEffect más abajo), evitando depender del
  // recorte de 100 tareas de la carga inicial cuando el evaluador tiene más tareas
  // que ese límite. `null` significa "sin filtro activo, usar el catálogo completo".
  const [hierarchyScopedTasks, setHierarchyScopedTasks] = useState(null);
  const filteredTasks = hierarchyScopedTasks ?? tasks;

  // Grupos, estudiantes e instrumentos no tienen un vínculo directo con la jerarquía académica,
  // así que se acotan a los que participan en al menos una tarea dentro del curso/módulo/clase filtrado.
  const scopedGroupIds = useMemo(
    () => new Set(filteredTasks.flatMap((task) => (task.groups ?? []).map(getId)).filter(Boolean)),
    [filteredTasks]
  );
  const scopedInstrumentIds = useMemo(
    () => new Set(filteredTasks.map((task) => task.instrument && getId(task.instrument)).filter(Boolean)),
    [filteredTasks]
  );
  const scopedStudentIds = useMemo(
    () => new Set(filteredTasks.flatMap((task) => (task.students ?? []).map(getId))),
    [filteredTasks]
  );

  const filteredGroups = useMemo(() => {
    if (!isHierarchyFilterActive) return groups;
    return groups.filter((group) => scopedGroupIds.has(getId(group)));
  }, [groups, isHierarchyFilterActive, scopedGroupIds]);

  const filteredInstruments = useMemo(() => {
    if (!isHierarchyFilterActive) return instruments;
    return instruments.filter((instrument) => scopedInstrumentIds.has(getId(instrument)));
  }, [instruments, isHierarchyFilterActive, scopedInstrumentIds]);

  const filteredStudents = useMemo(() => {
    if (!isHierarchyFilterActive) return students;
    return students.filter((student) => scopedStudentIds.has(getId(student)));
  }, [students, isHierarchyFilterActive, scopedStudentIds]);

  const activeOptions = useMemo(() => {
    if (reportType === 'student') return filteredStudents;
    if (reportType === 'group' || reportType === 'final') return filteredGroups;
    if (reportType === 'task') return filteredTasks;
    if (reportType === 'instrument') return filteredInstruments;
    return [];
  }, [filteredGroups, filteredInstruments, reportType, filteredStudents, filteredTasks]);

  const selectedId = reportType === 'final' ? selectedIds.final || selectedIds.group : selectedIds[reportType];
  const evaluations = report?.evaluations ?? [];
  const summaryValue = getSummaryValue(report);
  const studentPrintEnabled = Boolean(report?.permissions?.studentPrintEnabled);
  const hierarchyParams = useMemo(() => cleanHierarchyParams(hierarchyFilter), [hierarchyFilter]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCatalogs() {
      setIsLoading(true);
      setError('');
      setMessage('');

      try {
        const [studentsData, groupsData, tasksData, instrumentsData, coursesData] = await Promise.all([
          listResource('students', { limit: 100 }),
          listResource('groups', { limit: 100 }),
          listResource('tasks', { limit: 100 }),
          listResource('instruments', { limit: 100 }),
          listResource('courses', { limit: 100 }),
        ]);

        if (!isMounted) return;

        const nextStudents = studentsData.students ?? [];
        const nextGroups = groupsData.groups ?? [];
        const nextTasks = tasksData.tasks ?? [];
        const nextInstruments = instrumentsData.instruments ?? [];
        const nextCourses = coursesData.courses ?? [];

        setStudents(nextStudents);
        setGroups(nextGroups);
        setTasks(nextTasks);
        setInstruments(nextInstruments);
        setCourses(nextCourses);
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
        const nextReport = await getReport(reportType, selectedId, hierarchyParams);
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
  }, [hierarchyParams, reportType, selectedId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchScopedTasks() {
      if (!isHierarchyFilterActive) {
        setHierarchyScopedTasks(null);
        return;
      }

      try {
        const data = await listResource('tasks', { limit: 100, ...hierarchyParams });
        if (isMounted) setHierarchyScopedTasks(data.tasks ?? []);
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      }
    }

    fetchScopedTasks();

    return () => {
      isMounted = false;
    };
  }, [hierarchyParams, isHierarchyFilterActive]);

  useEffect(() => {
    let isMounted = true;

    async function fetchModulesForCourse() {
      if (!hierarchyFilter.courseId) return;

      try {
        const data = await listCourseModules(hierarchyFilter.courseId, { limit: 100 });
        if (isMounted) setHierarchyModules(data.modules ?? []);
      } catch {
        if (isMounted) setHierarchyModules([]);
      }
    }

    fetchModulesForCourse();

    return () => {
      isMounted = false;
    };
  }, [hierarchyFilter.courseId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchClassesForModule() {
      if (!hierarchyFilter.moduleId) return;

      try {
        const data = await listModuleClasses(hierarchyFilter.moduleId, { limit: 100 });
        if (isMounted) setHierarchyClasses(data.classes ?? []);
      } catch {
        if (isMounted) setHierarchyClasses([]);
      }
    }

    fetchClassesForModule();

    return () => {
      isMounted = false;
    };
  }, [hierarchyFilter.moduleId]);

  useEffect(() => {
    setSelectedIds((current) => {
      const currentId = reportType === 'final' ? current.final || current.group : current[reportType];
      const stillValid = activeOptions.some((option) => getId(option) === currentId);
      if (stillValid) return current;

      const nextId = activeOptions[0] ? getId(activeOptions[0]) : '';
      if (reportType === 'group' || reportType === 'final') {
        return { ...current, group: nextId, final: nextId };
      }
      return { ...current, [reportType]: nextId };
    });
  }, [activeOptions, reportType]);

  const handleCourseFilterChange = (event) => {
    const value = event.target.value;
    setHierarchyFilter({ courseId: value, moduleId: '', classId: '' });
    setHierarchyModules([]);
    setHierarchyClasses([]);
  };

  const handleModuleFilterChange = (event) => {
    const value = event.target.value;
    setHierarchyFilter((current) => ({ ...current, moduleId: value, classId: '' }));
    setHierarchyClasses([]);
  };

  const handleClassFilterChange = (event) => {
    const value = event.target.value;
    setHierarchyFilter((current) => ({ ...current, classId: value }));
  };

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
    const nextReport = await getReport(reportType, selectedId, hierarchyParams);
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

  const handleDownloadPdf = async () => {
    if (!report || !selectedId) return;

    setError('');
    setIsDownloading(true);

    try {
      const blob = await getPdfReport(reportType, selectedId, hierarchyParams);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${reportType}-${selectedId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenPrintableReport = async () => {
    if (!report || !selectedId) return;

    setError('');
    setMessage('');
    setIsPrinting(true);

    try {
      const html = await getPrintableReport(reportType, selectedId, hierarchyParams);
      openPrintableHtml(html);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsPrinting(false);
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
          <button
            className="button button-primary"
            type="button"
            onClick={handleOpenPrintableReport}
            disabled={!report || isPrinting}
          >
            {isPrinting ? <span className="button-spinner-ring" aria-hidden="true" /> : <Printer size={18} aria-hidden="true" />}
            {isPrinting ? 'Abriendo...' : 'Imprimir'}
          </button>
        </div>

        <div className="toolbar toolbar-wide" aria-label="Filtrar reporte por jerarquía académica">
          <select className="filter-select" value={hierarchyFilter.courseId} onChange={handleCourseFilterChange}>
            <option value="">Todos los cursos</option>
            {courses.map((course) => (
              <option value={getId(course)} key={getId(course)}>
                {course.name}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={hierarchyFilter.moduleId}
            onChange={handleModuleFilterChange}
            disabled={!hierarchyFilter.courseId}
          >
            <option value="">Todos los módulos</option>
            {hierarchyModules.map((module) => (
              <option value={getId(module)} key={getId(module)}>
                {module.name}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={hierarchyFilter.classId}
            onChange={handleClassFilterChange}
            disabled={!hierarchyFilter.moduleId}
          >
            <option value="">Todas las clases</option>
            {hierarchyClasses.map((academicClass) => (
              <option value={getId(academicClass)} key={getId(academicClass)}>
                {academicClass.name}
              </option>
            ))}
          </select>
        </div>

        {reportType === 'student' ? (
          <label className="permission-toggle">
            <input
              type="checkbox"
              checked={studentPrintEnabled}
              onChange={(event) => handlePrintPermission(event.target.checked)}
              disabled={!report || isUpdatingPermission || !evaluations.length}
            />
            <span className="permission-toggle-track" aria-hidden="true">
              <span className="permission-toggle-thumb" />
            </span>
            <span>
              <strong>Impresión del estudiante</strong>
              <small className={`permission-status ${studentPrintEnabled ? 'permission-status-allowed' : 'permission-status-denied'}`}>
                {studentPrintEnabled ? 'Permitido' : 'No permitido'}
              </small>
            </span>
          </label>
        ) : null}
      </div>

      <section className="print-sheet">
        <header className="print-header">
          <div>
            <p className="eyebrow">EvaluaPro</p>
            <h1>{reportTitles[reportType]}</h1>
            <p>{report?.generatedAt ? new Date(report.generatedAt).toLocaleDateString('es-DO') : new Date().toLocaleDateString('es-DO')}</p>
          </div>
          <strong>{formatGrade(summaryValue)}</strong>
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
                  <td>{formatGrade(grade.finalGrade)}</td>
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
                <th>Nota final</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((evaluation) => (
                <tr key={getId(evaluation)}>
                  <td>{getStudentName(evaluation)}</td>
                  <td>{getTaskTitle(evaluation, report)}</td>
                  <td>{getInstrumentTitle(evaluation)}</td>
                  <td>{evaluation.score}/{evaluation.maxScore}</td>
                  <td>{evaluation.percentage}</td>
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
          <h2>Retroalimentación</h2>
          {evaluations.map((evaluation) => (
            <p key={`${getId(evaluation)}-feedback`}>
              <strong>{getTaskTitle(evaluation, report)}:</strong> {evaluation.feedback || 'Sin retroalimentación registrada.'}
            </p>
          ))}
          {!evaluations.length && reportType !== 'final' ? <p>No hay evaluaciones publicadas para este reporte.</p> : null}
        </div>
      </section>

      <button
        className="floating-print no-print"
        type="button"
        onClick={handleDownloadPdf}
        title="Descargar PDF"
        disabled={!report || isDownloading}
      >
        {isDownloading ? <span className="button-spinner-ring" aria-hidden="true" /> : <Download size={20} aria-hidden="true" />}
      </button>
    </section>
  );
}

export default EvaluatorReportsPage;
