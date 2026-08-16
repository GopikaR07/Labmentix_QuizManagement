import { useEffect, useState } from "react";
import api from "../../api.js";

export default function AdminAttempts() {

    const [attempts, setAttempts] = useState([]);
    const [error, setError] = useState("");
    const [detail, setDetail] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");

    const load = (status = "") => {
        api.get("/admin/attempts", { params: status ? { status } : {} })
            .then((res) => setAttempts(res.data))
            .catch((err) => setError(err.response?.data?.message || "Failed to load attempts"));
    };

    useEffect(() => load(), []);

    const handleFilter = (status) => {
        setStatusFilter(status);
        load(status);
    };

    const viewDetail = async (id) => {
        const { data } = await api.get(`/admin/attempts/${id}`);
        setDetail(data);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>All attempts</h1>
                    <p>Every quiz attempt across all students.</p>
                </div>
                <div className="tabs" style={{ borderBottom: "none", marginBottom: 0 }}>
                    {["", "PASSED", "FAILED", "IN_PROGRESS"].map((s) => (
                        <button key={s} className={statusFilter === s ? "active" : ""} onClick={() => handleFilter(s)}>
                            {s || "All"}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="card">
                {attempts.length === 0 ? (
                    <div className="empty-state">No attempts found.</div>
                ) : (
                    <table>
                        <thead>
                            <tr><th>Student</th><th>Quiz</th><th>Score</th><th>Status</th><th>Date</th><th></th></tr>
                        </thead>
                        <tbody>
                            {attempts.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.student_name}<br /><span className="small-muted">{a.student_email}</span></td>
                                    <td>{a.quiz_title}</td>
                                    <td>{a.percentage !== null ? `${a.percentage}%` : "—"}</td>
                                    <td>
                                        <span className={`pill ${a.status === "PASSED" ? "pill-success" : a.status === "FAILED" ? "pill-danger" : "pill-warning"}`}>
                                            {a.status}
                                        </span>
                                    </td>
                                    <td>{new Date(a.started_at).toLocaleString()}</td>
                                    <td><button className="btn btn-sm" onClick={() => viewDetail(a.id)}>Review</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {detail && (
                <div className="card">
                    <div className="page-header" style={{ marginBottom: 12 }}>
                        <h3 style={{ margin: 0 }}>{detail.student_name} — {detail.quiz_title}</h3>
                        <button className="btn btn-sm" onClick={() => setDetail(null)}>Close</button>
                    </div>
                    <p className="small-muted">
                        Score: {detail.percentage}% ({detail.correct_answers} correct, {detail.incorrect_answers} incorrect, {detail.unanswered} unanswered) — passing score {detail.passing_score}%
                    </p>
                    {detail.review.map((r) => (
                        <div key={r.question_id} className="question-block">
                            <div className="q-title">{r.question_text}</div>
                            <div className={`option-row ${r.is_correct ? "correct" : "incorrect"}`} style={{ cursor: "default" }}>
                                Selected: {r.selected_option_text || "No answer"}
                            </div>
                            {!r.is_correct && (
                                <div className="option-row correct" style={{ cursor: "default" }}>
                                    Correct: {r.correct_option_text}
                                </div>
                            )}
                            {r.explanation && <p className="small-muted">{r.explanation}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
