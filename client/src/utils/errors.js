export function getErrorMessage(error) {
  if (!error?.response && error?.message === 'Network Error') {
    return 'No se pudo conectar con la API. Verifica que el servidor esté encendido y que VITE_API_URL apunte al backend correcto.';
  }

  return (
    error?.response?.data?.message ??
    error?.message ??
    'No se pudo completar la acción. Intentalo nuevamente.'
  );
}
