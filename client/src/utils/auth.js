export function getDashboardPath(role) {
  const paths = {
    admin: '/admin',
    evaluator: '/evaluator',
    student: '/student',
  };

  return paths[role] ?? '/';
}
