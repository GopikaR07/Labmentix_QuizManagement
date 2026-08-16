import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminCategories from "./pages/admin/AdminCategories.jsx";
import AdminQuizzes from "./pages/admin/AdminQuizzes.jsx";
import AdminQuestions from "./pages/admin/AdminQuestions.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminAttempts from "./pages/admin/AdminAttempts.jsx";

import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentQuizzes from "./pages/student/StudentQuizzes.jsx";
import StudentQuizDetails from "./pages/student/StudentQuizDetails.jsx";
import TakeQuiz from "./pages/student/TakeQuiz.jsx";
import StudentAttempts from "./pages/student/StudentAttempts.jsx";
import AttemptReview from "./pages/student/AttemptReview.jsx";
import Leaderboard from "./pages/student/Leaderboard.jsx";

function HomeRedirect() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/student"} replace />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    <Route element={<ProtectedRoute role="ADMIN"><Layout /></ProtectedRoute>}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/categories" element={<AdminCategories />} />
                        <Route path="/admin/quizzes" element={<AdminQuizzes />} />
                        <Route path="/admin/quizzes/:quizId/questions" element={<AdminQuestions />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/attempts" element={<AdminAttempts />} />
                    </Route>

                    <Route element={<ProtectedRoute role="STUDENT"><Layout /></ProtectedRoute>}>
                        <Route path="/student" element={<StudentDashboard />} />
                        <Route path="/student/quizzes" element={<StudentQuizzes />} />
                        <Route path="/student/quizzes/:quizId" element={<StudentQuizDetails />} />
                        <Route path="/student/quizzes/:quizId/take" element={<TakeQuiz />} />
                        <Route path="/student/attempts" element={<StudentAttempts />} />
                        <Route path="/student/attempts/:id" element={<AttemptReview />} />
                        <Route path="/student/leaderboard" element={<Leaderboard />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
