import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api.js";

export default function StudentAttempts() {

    const [attempts, setAttempts] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/attempts")
            .then((res) => setAttempts(res.data))
            .catch((err) => setError(err.response?.data?.message || "Failed to load attempts"));
    }, []);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>My attempts</h1>
                    <p>Every quiz you've started or completed.</p>
                </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="card">
                {attempts.length === 0 ? (
                    <div className="empty-state">
                        No attempts yet. <Link to="/student/quizzes">Browse quizzes</Link> to get started.
                    </div>
                ) : (
                    <table>
                        <thead><tr><th>Quiz</th><th>Category</th><th>Score</th><th>Status</th><th>Date</th><th></th></tr></thead>
                        <tbody>
                            {attempts.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.quiz_title}</td>
                                    <td>{a.category_name || "—"}</td>
                                    <td>{a.percentage !== null ? `${a.percentage}%` : "—"}</td>
                                    <td>
                                        <span className={`pill ${a.status === "PASSED" ? "pill-success" : a.status === "FAILED" ? "pill-danger" : "pill-warning"}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td>{new Date(a.started_at).toLocaleString()}</td>
                                    <td>
                                        {a.status !== "IN_PROGRESS" && (
                                            <Link className="btn btn-sm" to={`/student/attempts/${a.id}`}>Review</Link>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
