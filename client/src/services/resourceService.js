import api from './api.js';

const endpointMap = {
  groups: '/groups',
  students: '/users',
  tasks: '/tasks',
  instruments: '/instruments',
  evaluations: '/evaluations',
  reports: '/reports',
};

export async function listResource(resource, params) {
  const { data } = await api.get(endpointMap[resource], { params });
  return data;
}

export async function createResource(resource, payload) {
  const { data } = await api.post(endpointMap[resource], payload);
  return data;
}

export async function updateResource(resource, id, payload) {
  const { data } = await api.patch(`${endpointMap[resource]}/${id}`, payload);
  return data;
}

export async function deleteResource(resource, id) {
  const { data } = await api.delete(`${endpointMap[resource]}/${id}`);
  return data;
}
