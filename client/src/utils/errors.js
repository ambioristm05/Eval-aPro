export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ??
    error?.message ??
    'No se pudo completar la acción. Intentalo nuevamente.'
  );
}
