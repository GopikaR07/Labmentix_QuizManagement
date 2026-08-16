import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../api.js";

const DIFFICULTY_PILL = { BEGINNER: "pill-success", INTERMEDIATE: "pill-warning", ADVANCED: "pill-danger" };

export default function StudentQuizDetails() {

    const { quizId } = useParams();
    const navigate = useNavigate();

    const [quiz, setQuiz] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get(`/quizzes/${quizId}`)
            .then((res) => setQuiz(res.data))
            .catch((err) => setError(err.response?.data?.message || "Failed to load quiz"));
    }, [quizId]);

    if (error) {
        return (
            <div className="page">
                <div className="error-box">{error}</div>
                <Link className="btn" to="/student/quizzes">Back to quizzes</Link>
            </div>
        );
    }

    if (!quiz) return <div className="loading-text">Loading quiz…</div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link className="small-muted" to="/student/quizzes">&larr; Back to quizzes</Link>
                </div>
            </div>

            <div className="card quiz-details-card">
                <div className="quiz-details-head">
                    <h1>{quiz.title}</h1>
                    <span className={`pill ${DIFFICULTY_PILL[quiz.difficulty]}`}>{quiz.difficulty}</span>
                </div>
                <p className="small-muted">{quiz.category_name || "Uncategorized"}</p>

                <p>{quiz.description || "No description provided."}</p>

                <div className="quiz-details-stats">
                    <div className="quiz-details-stat">
                        <div className="quiz-details-stat-value">{quiz.question_count}</div>
                        <div className="quiz-details-stat-label">Questions</div>
                    </div>
                    <div className="quiz-details-stat">
                        <div className="quiz-details-stat-value">{quiz.duration} min</div>
                        <div className="quiz-details-stat-label">Duration</div>
                    </div>
                    <div className="quiz-details-stat">
                        <div className="quiz-details-stat-value">{quiz.passing_score}%</div>
                        <div className="quiz-details-stat-label">Pass score</div>
                    </div>
                </div>

                <p className="small-muted">Maximum attempts: {quiz.max_attempts}</p>

                <button className="btn btn-primary" onClick={() => navigate(`/student/quizzes/${quizId}/take`)}>
                    Start Quiz
                </button>
            </div>
        </div>
    );
}
