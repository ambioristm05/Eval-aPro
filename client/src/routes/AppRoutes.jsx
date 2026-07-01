import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import {
  AdminEvaluatorsPage,
  AdminInvitationsPage,
  AdminSettingsPage,
  AdminStatisticsPage,
} from '../pages/admin/AdminModulePages.jsx';
import EvaluatorDashboard from '../pages/evaluator/EvaluatorDashboard.jsx';
import {
  EvaluatorEvaluationsPage,
  EvaluatorInstrumentsPage,
  EvaluatorProfilePage,
  EvaluatorReportsPage,
  EvaluatorStudentsPage,
  EvaluatorTasksPage,
} from '../pages/evaluator/EvaluatorModulePages.jsx';
import EvaluatorGroupsPage from '../pages/evaluator/EvaluatorGroupsPage.jsx';
import LoginPage from '../pages/public/LoginPage.jsx';
import PublicHomePage from '../pages/public/PublicHomePage.jsx';
import StudentRegisterPage from '../pages/public/StudentRegisterPage.jsx';
import StudentDashboard from '../pages/student/StudentDashboard.jsx';
import {
  StudentEvaluationsPage,
  StudentProfilePage,
  StudentResultsPage,
  StudentSuggestionsPage,
  StudentTasksPage,
} from '../pages/student/StudentModulePages.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<PublicHomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register/student" element={<StudentRegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/evaluators" element={<AdminEvaluatorsPage />} />
            <Route path="admin/invitations" element={<AdminInvitationsPage />} />
            <Route path="admin/statistics" element={<AdminStatisticsPage />} />
            <Route path="admin/settings" element={<AdminSettingsPage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['evaluator']} />}>
            <Route path="evaluator" element={<EvaluatorDashboard />} />
            <Route path="evaluator/groups" element={<EvaluatorGroupsPage />} />
            <Route path="evaluator/students" element={<EvaluatorStudentsPage />} />
            <Route path="evaluator/tasks" element={<EvaluatorTasksPage />} />
            <Route path="evaluator/instruments" element={<EvaluatorInstrumentsPage />} />
            <Route path="evaluator/evaluations" element={<EvaluatorEvaluationsPage />} />
            <Route path="evaluator/reports" element={<EvaluatorReportsPage />} />
            <Route path="evaluator/profile" element={<EvaluatorProfilePage />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['student']} />}>
            <Route path="student" element={<StudentDashboard />} />
            <Route path="student/tasks" element={<StudentTasksPage />} />
            <Route path="student/evaluations" element={<StudentEvaluationsPage />} />
            <Route path="student/results" element={<StudentResultsPage />} />
            <Route path="student/suggestions" element={<StudentSuggestionsPage />} />
            <Route path="student/profile" element={<StudentProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
