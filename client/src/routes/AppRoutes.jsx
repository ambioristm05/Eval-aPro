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
import EvaluatorEvaluationsPage from '../pages/evaluator/EvaluatorEvaluationsPage.jsx';
import EvaluatorReportsPage from '../pages/evaluator/EvaluatorReportsPage.jsx';
import EvaluatorGroupsPage from '../pages/evaluator/EvaluatorGroupsPage.jsx';
import EvaluatorInstrumentsPage from '../pages/evaluator/EvaluatorInstrumentsPage.jsx';
import ChecklistBuilderPage from '../pages/evaluator/ChecklistBuilderPage.jsx';
import RubricBuilderPage from '../pages/evaluator/RubricBuilderPage.jsx';
import EvaluatorStudentsPage from '../pages/evaluator/EvaluatorStudentsPage.jsx';
import EvaluatorTasksPage from '../pages/evaluator/EvaluatorTasksPage.jsx';
import LoginPage from '../pages/public/LoginPage.jsx';
import EvaluatorRegisterPage from '../pages/public/EvaluatorRegisterPage.jsx';
import PublicHomePage from '../pages/public/PublicHomePage.jsx';
import StudentRegisterPage from '../pages/public/StudentRegisterPage.jsx';
import StudentDashboard from '../pages/student/StudentDashboard.jsx';
import ProfilePage from '../pages/shared/ProfilePage.jsx';
import { StudentTasksPage } from '../pages/student/StudentModulePages.jsx';
import {
  StudentEvaluationsRealPage,
  StudentResultsRealPage,
  StudentSuggestionsRealPage,
} from '../pages/student/StudentResultsPages.jsx';
import GuestRoute from './GuestRoute.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<PublicHomePage />} />
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register/student" element={<StudentRegisterPage />} />
          <Route path="register/evaluator" element={<EvaluatorRegisterPage />} />
        </Route>

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
            <Route path="evaluator/instruments/rubric-builder" element={<RubricBuilderPage />} />
            <Route path="evaluator/instruments/checklist-builder" element={<ChecklistBuilderPage />} />
            <Route path="evaluator/evaluations" element={<EvaluatorEvaluationsPage />} />
            <Route path="evaluator/reports" element={<EvaluatorReportsPage />} />
            <Route path="evaluator/profile" element={<ProfilePage role="evaluator" />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['student']} />}>
            <Route path="student" element={<StudentDashboard />} />
            <Route path="student/tasks" element={<StudentTasksPage />} />
            <Route path="student/evaluations" element={<StudentEvaluationsRealPage />} />
            <Route path="student/results" element={<StudentResultsRealPage />} />
            <Route path="student/suggestions" element={<StudentSuggestionsRealPage />} />
            <Route path="student/profile" element={<ProfilePage role="student" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
