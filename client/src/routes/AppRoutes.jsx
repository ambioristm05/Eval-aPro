import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import AdminEvaluatorsPage from '../pages/admin/AdminEvaluatorsPage.jsx';
import AdminStudentsPage from '../pages/admin/AdminStudentsPage.jsx';
import AdminCoursesPage from '../pages/admin/AdminCoursesPage.jsx';
import { AdminInvitationsPage } from '../pages/admin/AdminModulePages.jsx';
import AdminAuditPage from '../pages/admin/AdminAuditPage.jsx';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage.jsx';
import AdminStatisticsPage from '../pages/admin/AdminStatisticsPage.jsx';
import EvaluatorStatisticsPage from '../pages/evaluator/EvaluatorStatisticsPage.jsx';
import ClassDetailPage from '../pages/evaluator/ClassDetailPage.jsx';
import ClassArchivePage from '../pages/evaluator/ClassArchivePage.jsx';
import CourseDetailPage from '../pages/evaluator/CourseDetailPage.jsx';
import EvaluatorCoursesPage from '../pages/evaluator/EvaluatorCoursesPage.jsx';
import EvaluatorDashboard from '../pages/evaluator/EvaluatorDashboard.jsx';
import EvaluatorEvaluationsPage from '../pages/evaluator/EvaluatorEvaluationsPage.jsx';
import EvaluatorReportsPage from '../pages/evaluator/EvaluatorReportsPage.jsx';
import EvaluatorTaskDetailPage from '../pages/evaluator/EvaluatorTaskDetailPage.jsx';
import ModuleDetailPage from '../pages/evaluator/ModuleDetailPage.jsx';
import EvaluatorGroupsPage from '../pages/evaluator/EvaluatorGroupsPage.jsx';
import EvaluatorInstrumentsPage from '../pages/evaluator/EvaluatorInstrumentsPage.jsx';
import InstrumentArchivePage from '../pages/evaluator/InstrumentArchivePage.jsx';
import ChecklistBuilderPage from '../pages/evaluator/ChecklistBuilderPage.jsx';
import RubricBuilderPage from '../pages/evaluator/RubricBuilderPage.jsx';
import EvaluatorProfilePage from '../pages/evaluator/EvaluatorProfilePage.jsx';
import EvaluatorStudentsPage from '../pages/evaluator/EvaluatorStudentsPage.jsx';
import LegalPage from '../pages/public/LegalPage.jsx';
import NotFoundPage from '../pages/public/NotFoundPage.jsx';
import ResetPasswordPage from '../pages/public/ResetPasswordPage.jsx';
import LoginPage from '../pages/public/LoginPage.jsx';
import EvaluatorRegisterPage from '../pages/public/EvaluatorRegisterPage.jsx';
import PublicHomePage from '../pages/public/PublicHomePage.jsx';
import StudentRegisterPage from '../pages/public/StudentRegisterPage.jsx';
import StudentDashboard from '../pages/student/StudentDashboard.jsx';
import MessagesPage from '../pages/shared/MessagesPage.jsx';
import ProfilePage from '../pages/shared/ProfilePage.jsx';
import StudentGroupPage from '../pages/student/StudentGroupPage.jsx';
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
        <Route path="legal" element={<LegalPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register/student" element={<StudentRegisterPage />} />
          <Route path="register/evaluator" element={<EvaluatorRegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/evaluators" element={<AdminEvaluatorsPage />} />
            <Route path="admin/students" element={<AdminStudentsPage />} />
            <Route path="admin/courses" element={<AdminCoursesPage />} />
            <Route path="admin/invitations" element={<AdminInvitationsPage />} />
            <Route path="admin/statistics" element={<AdminStatisticsPage />} />
            <Route path="admin/audit" element={<AdminAuditPage />} />
            <Route path="admin/settings" element={<AdminSettingsPage />} />
            <Route path="admin/messages" element={<MessagesPage />} />
            <Route path="admin/profile" element={<ProfilePage role="admin" />} />
            <Route path="admin/profile/edit" element={<ProfilePage role="admin" mode="edit" />} />
            <Route path="admin/profile/delete" element={<ProfilePage role="admin" mode="delete" />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['evaluator']} />}>
            <Route path="evaluator" element={<EvaluatorDashboard />} />
            <Route path="evaluator/courses" element={<EvaluatorCoursesPage />} />
            <Route path="evaluator/courses/groups" element={<EvaluatorGroupsPage />} />
            <Route path="evaluator/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="evaluator/courses/:courseId/modules/:moduleId" element={<ModuleDetailPage />} />
            <Route
              path="evaluator/courses/:courseId/modules/:moduleId/classes/archive"
              element={<ClassArchivePage />}
            />
            <Route
              path="evaluator/courses/:courseId/modules/:moduleId/classes/:classId"
              element={<ClassDetailPage />}
            />
            <Route
              path="evaluator/courses/:courseId/modules/:moduleId/classes/:classId/tasks/:taskId"
              element={<EvaluatorTaskDetailPage />}
            />
            <Route path="evaluator/groups" element={<Navigate to="/evaluator/courses/groups" replace />} />
            <Route path="evaluator/students" element={<EvaluatorStudentsPage />} />
            <Route path="evaluator/tasks" element={<Navigate to="/evaluator/courses" replace />} />
            <Route path="evaluator/instruments" element={<EvaluatorInstrumentsPage />} />
            <Route path="evaluator/instruments/archive" element={<InstrumentArchivePage />} />
            <Route path="evaluator/instruments/rubric-builder" element={<RubricBuilderPage />} />
            <Route path="evaluator/instruments/rubric-builder/:id" element={<RubricBuilderPage />} />
            <Route path="evaluator/instruments/checklist-builder" element={<ChecklistBuilderPage />} />
            <Route path="evaluator/instruments/checklist-builder/:id" element={<ChecklistBuilderPage />} />
            <Route path="evaluator/evaluations" element={<EvaluatorEvaluationsPage />} />
            <Route path="evaluator/reports" element={<EvaluatorReportsPage />} />
            <Route path="evaluator/statistics" element={<EvaluatorStatisticsPage />} />
            <Route path="evaluator/messages" element={<MessagesPage />} />
            <Route path="evaluator/profile" element={<EvaluatorProfilePage />} />
            <Route path="evaluator/profile/edit" element={<EvaluatorProfilePage mode="edit" />} />
            <Route path="evaluator/profile/delete" element={<EvaluatorProfilePage mode="delete" />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['student']} />}>
            <Route path="student" element={<StudentDashboard />} />
            <Route path="student/group" element={<StudentGroupPage />} />
            <Route path="student/tasks" element={<StudentTasksPage />} />
            <Route path="student/evaluations" element={<StudentEvaluationsRealPage />} />
            <Route path="student/results" element={<StudentResultsRealPage />} />
            <Route path="student/suggestions" element={<StudentSuggestionsRealPage />} />
            <Route path="student/messages" element={<MessagesPage />} />
            <Route path="student/profile" element={<ProfilePage role="student" />} />
            <Route path="student/profile/edit" element={<ProfilePage role="student" mode="edit" />} />
            <Route path="student/profile/delete" element={<ProfilePage role="student" mode="delete" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
