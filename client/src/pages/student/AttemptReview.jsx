import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api.js";

export default function AttemptReview() {

    const { id } = useParams();
    const [attempt, setAttempt] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get(`/attempts/${id}`)
            .then((res) => setAttempt(res.data))
            .catch((err) => setError(err.response?.data?.message || "Failed to load attempt"));
    }, [id]);

    if (error) return <div className="page"><div className="error-box">{error}</div></div>;
    if (!attempt) return <div className="loading-text">Loading…</div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to="/student/attempts" className="small-muted">&larr; Back to attempts</Link>
                    <h1>{attempt.quiz_title}</h1>
                    <p>
                        <span className={`pill ${attempt.status === "PASSED" ? "pill-success" : "pill-danger"}`}>{attempt.status}</span>
                        {" "}{attempt.percentage}% · pass at {attempt.passing_score}%
                    </p>
                </div>
            </div>

            <div className="card">
                {attempt.review.map((r, idx) => (
                    <div key={r.question_id} className="question-block">
                        <div className="q-title">{idx + 1}. {r.question_text}</div>
                        <div className={`option-row ${r.is_correct ? "correct" : "incorrect"}`} style={{ cursor: "default" }}>
                            Your answer: {r.selected_option_text || "No answer"}
                        </div>
                        {!r.is_correct && (
                            <div className="option-row correct" style={{ cursor: "default" }}>
                                Correct answer: {r.correct_option_text}
                            </div>
                        )}
                        {r.explanation && <p className="small-muted">{r.explanation}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
