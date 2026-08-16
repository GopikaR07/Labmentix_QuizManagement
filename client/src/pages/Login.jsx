import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {

    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const [role, setRole] = useState("STUDENT");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await login(email, password);

            // The server is the real source of truth for role (every route
            // is already locked down by requireAdmin/requireRole there).
            // This check is just a UX guardrail so someone doesn't land in
            // the wrong dashboard by picking the wrong tab.
            if (user.role !== role) {
                logout();
                setError(
                    role === "ADMIN"
                        ? "This account is registered as a Student, not an Admin. Switch tabs and try again."
                        : "This account is registered as an Admin, not a Student. Switch tabs and try again."
                );
                return;
            }

            navigate(user.role === "ADMIN" ? "/admin" : "/student");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrap">
            <div className="card auth-card">
                <h1>Log in</h1>
                <p className="subtitle">Quiz Management &amp; Assessment Platform</p>

                <div className="role-toggle">
                    <button
                        type="button"
                        className={role === "STUDENT" ? "active" : ""}
                        onClick={() => setRole("STUDENT")}
                    >
                        Student
                    </button>
                    <button
                        type="button"
                        className={role === "ADMIN" ? "active" : ""}
                        onClick={() => setRole("ADMIN")}
                    >
                        Admin
                    </button>
                </div>

                {error && <div className="error-box">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
                        {loading ? "Logging in…" : `Log in as ${role === "ADMIN" ? "Admin" : "Student"}`}
                    </button>
                </form>

                {role === "STUDENT" && (
                    <p className="small-muted" style={{ marginTop: 16 }}>
                        New here? <Link to="/register">Create a student account</Link>
                    </p>
                )}
                <p className="small-muted">
                    <Link to="/forgot-password">Forgot password?</Link>
                </p>
            </div>
        </div>
    );
}
