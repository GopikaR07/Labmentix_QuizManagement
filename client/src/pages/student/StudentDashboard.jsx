import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api.js";

export default function StudentDashboard() {

    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/attempts/stats/summary")
            .then((res) => setStats(res.data))
            .catch((err) => setError(err.response?.data?.message || "Failed to load stats"));
    }, []);

    if (error) return <div className="page"><div className="error-box">{error}</div></div>;
    if (!stats) return <div className="loading-text">Loading dashboard…</div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Your dashboard</h1>
                    <p>Track your quiz performance.</p>
                </div>
                <Link className="btn btn-primary" to="/student/quizzes">Browse quizzes</Link>
            </div>

            <div className="grid grid-4">
                <StatCard label="Quizzes attempted" value={stats.quizzes_attempted} />
                <StatCard label="Passed" value={stats.quizzes_passed} />
                <StatCard label="Failed" value={stats.quizzes_failed} />
                <StatCard label="Average score" value={`${stats.average_score}%`} />
                <StatCard label="Highest score" value={`${stats.highest_score}%`} />
                <StatCard label="Questions answered" value={stats.total_questions_answered} />
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0 }}>Recent attempts</h3>
                {stats.recent_attempts.length === 0 ? (
                    <p className="small-muted">You haven't completed any quizzes yet.</p>
                ) : (
                    <table>
                        <thead><tr><th>Quiz</th><th>Score</th><th>Status</th><th>Date</th></tr></thead>
                        <tbody>
                            {stats.recent_attempts.map((a) => (
                                <tr key={a.id}>
                                    <td><Link to={`/student/attempts/${a.id}`}>{a.quiz_title}</Link></td>
                                    <td>{a.percentage}%</td>
                                    <td><span className={`pill ${a.status === "PASSED" ? "pill-success" : "pill-danger"}`}>{a.status}</span></td>
                                    <td>{new Date(a.completed_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="card stat-card">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}
