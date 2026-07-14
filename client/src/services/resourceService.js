import api from './api.js';

const endpointMap = {
  courses: '/courses',
  modules: '/modules',
  classes: '/classes',
  groups: '/groups',
  students: '/users/students',
  tasks: '/tasks',
  instruments: '/instruments',
  evaluations: '/evaluations',
  reports: '/reports',
};

export async function listResource(resource, params) {
  const { data } = await api.get(endpointMap[resource], { params });
  return data;
}

export async function getResource(resource, id) {
  const { data } = await api.get(`${endpointMap[resource]}/${id}`);
  return data;
}

export async function createResource(resource, payload) {
  const { data } = await api.post(endpointMap[resource], payload);
  return data;
}

export async function listCourseModules(courseId, params) {
  const { data } = await api.get(`/courses/${courseId}/modules`, { params });
  return data;
}

export async function createCourseModule(courseId, payload) {
  const { data } = await api.post(`/courses/${courseId}/modules`, payload);
  return data;
}

export async function listModuleClasses(moduleId, params) {
  const { data } = await api.get(`/modules/${moduleId}/classes`, { params });
  return data;
}

export async function createModuleClass(moduleId, payload) {
  const { data } = await api.post(`/modules/${moduleId}/classes`, payload);
  return data;
}

export async function listClassTasks(classId, params) {
  const { data } = await api.get(`/classes/${classId}/tasks`, { params });
  return data;
}

export async function createClassTask(classId, payload) {
  const { data } = await api.post(`/classes/${classId}/tasks`, payload);
  return data;
}

export async function updateResource(resource, id, payload) {
  const { data } = await api.patch(`${endpointMap[resource]}/${id}`, payload);
  return data;
}

export async function deleteResource(resource, id, params) {
  const { data } = await api.delete(`${endpointMap[resource]}/${id}`, { params });
  return data;
}

export async function deleteResourcePermanent(resource, id, options = {}) {
  const { cascade, ...rest } = options;
  const { data } = await api.delete(`${endpointMap[resource]}/${id}/permanent`, {
    params: cascade ? { cascade: true } : undefined,
    ...rest,
  });
  return data;
}

export async function addStudentToGroup(groupId, studentId) {
  const { data } = await api.post(`/groups/${groupId}/students`, { studentId });
  return data;
}

export async function removeStudentFromGroup(groupId, studentId) {
  const { data } = await api.delete(`/groups/${groupId}/students/${studentId}`);
  return data;
}

export async function suspendStudent(studentId, reason) {
  const { data } = await api.patch(`/users/${studentId}/suspend`, { reason });
  return data;
}

export async function reactivateStudent(studentId, reason = '') {
  const { data } = await api.patch(`/users/${studentId}/reactivate`, { reason });
  return data;
}

export async function deleteStudent(studentId, reason) {
  const { data } = await api.delete(`/users/${studentId}`, { data: { reason } });
  return data;
}

export async function publishEvaluation(evaluationId) {
  const { data } = await api.patch(`/evaluations/${evaluationId}/publish`);
  return data;
}

export async function updateStudentReportPermission(studentId, enabled) {
  const { data } = await api.patch(`/reports/student/${studentId}/print-permission`, { enabled });
  return data;
}

export async function getReport(type, id, params) {
  const pathMap = {
    student: `/reports/student/${id}`,
    group: `/reports/group/${id}`,
    task: `/reports/task/${id}`,
    final: `/reports/final-grades/${id}`,
    instrument: `/reports/instruments/${id}`,
  };

  const { data } = await api.get(pathMap[type], { params });
  return data.report;
}

export async function getPrintableReport(type, id, params) {
  const pathMap = {
    student: `/reports/student/${id}/print`,
    group: `/reports/group/${id}/print`,
    task: `/reports/task/${id}/print`,
    final: `/reports/final-grades/${id}/print`,
    instrument: `/reports/instruments/${id}/print`,
  };

  const { data } = await api.get(pathMap[type], { params, responseType: 'text' });
  return data;
}

export async function getPdfReport(type, id, params) {
  const pathMap = {
    student: `/reports/student/${id}/pdf`,
    group: `/reports/group/${id}/pdf`,
    task: `/reports/task/${id}/pdf`,
    final: `/reports/final-grades/${id}/pdf`,
    instrument: `/reports/instruments/${id}/pdf`,
  };

  const response = await api.get(pathMap[type], { params, responseType: 'blob' });
  return response.data;
}
