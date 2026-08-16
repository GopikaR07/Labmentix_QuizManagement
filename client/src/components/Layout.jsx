import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ADMIN_LINKS = [
    { to: "/admin", label: "Dashboard", end: true },
    { to: "/admin/categories", label: "Categories" },
    { to: "/admin/quizzes", label: "Quizzes" },
    { to: "/admin/users", label: "Students" },
    { to: "/admin/attempts", label: "Attempts" }
];

const STUDENT_LINKS = [
    { to: "/student", label: "Dashboard", end: true },
    { to: "/student/quizzes", label: "Browse Quizzes" },
    { to: "/student/attempts", label: "My Attempts" },
    { to: "/student/leaderboard", label: "Leaderboard" }
];

export default function Layout() {

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const links = user?.role === "ADMIN" ? ADMIN_LINKS : STUDENT_LINKS;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="app-shell-sidebar">
            <aside className="sidebar">
                <div className="sidebar-brand">Quiz Platform</div>

                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink key={link.to} to={link.to} end={link.end}>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <div className="main-col">
                <div className="topbar-slim">
                    <span className="badge-role">{user?.role}</span>
                    <span className="small-muted" style={{ marginRight: 12 }}>{user?.name}</span>
                    <button className="btn btn-sm" onClick={handleLogout}>Log out</button>
                </div>
                <Outlet />
            </div>
        </div>
    );
}
