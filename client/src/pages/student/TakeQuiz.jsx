import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api.js";

export default function TakeQuiz() {

    const { quizId } = useParams();

    const [session, setSession] = useState(null); // { attempt_id, quiz, questions, started_at }
    const [answers, setAnswers] = useState({}); // question_id -> option_id
    const [current, setCurrent] = useState(0); // index of question on screen
    const [remaining, setRemaining] = useState(0); // seconds
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    const submittedRef = useRef(false); // guards against double-submit (manual + timer racing)

    useEffect(() => {
        api.post(`/quizzes/${quizId}/start`)
            .then((res) => {
                setSession(res.data);
                const elapsed = Math.floor((Date.now() - new Date(res.data.started_at).getTime()) / 1000);
                setRemaining(Math.max(res.data.quiz.duration * 60 - elapsed, 0));
            })
            .catch((err) => setError(err.response?.data?.message || "Could not start this quiz"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizId]);

    useEffect(() => {
        if (!session || result) return;

        const interval = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    doSubmit(); // time's up — auto-submit whatever's answered
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, result]);

    const selectAnswer = (questionId, optionId) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    };

    const doSubmit = async () => {
        if (submittedRef.current || !session) return;
        submittedRef.current = true;
        setSubmitting(true);
        setError("");

        const payload = {
            attempt_id: session.attempt_id,
            answers: Object.entries(answers).map(([question_id, selected_option_id]) => ({
                question_id: Number(question_id),
                selected_option_id
            }))
        };

        try {
            const { data } = await api.post(`/quizzes/${quizId}/submit`, payload);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit quiz");
            submittedRef.current = false;
        } finally {
            setSubmitting(false);
        }
    };

    if (error && !session) {
        return (
            <div className="page">
                <div className="error-box">{error}</div>
                <Link className="btn" to="/student/quizzes">Back to quizzes</Link>
            </div>
        );
    }

    if (!session) return <div className="loading-text">Starting quiz…</div>;

    if (result) {
        return (
            <div className="page">
                <div className="card" style={{ textAlign: "center" }}>
                    <span className={`pill ${result.status === "PASSED" ? "pill-success" : "pill-danger"}`} style={{ fontSize: "1rem", padding: "6px 16px" }}>
                        {result.status}
                    </span>
                    <h1 style={{ marginTop: 12 }}>{result.percentage}%</h1>
                    <p className="small-muted">
                        {result.obtained_marks} / {result.total_marks} marks · {result.correct_answers} correct · {result.incorrect_answers} incorrect · {result.unanswered} unanswered
                    </p>
                    <div className="inline-form-actions" style={{ justifyContent: "center" }}>
                        <Link className="btn btn-primary" to={`/student/attempts/${result.attempt_id}`}>Review answers</Link>
                        <Link className="btn" to="/student/quizzes">Back to quizzes</Link>
                    </div>
                </div>
            </div>
        );
    }

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const isLow = remaining <= 60;

    const total = session.questions.length;
    const question = session.questions[current];
    const isFirst = current === 0;
    const isLast = current === total - 1;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>{session.quiz.title}</h1>
                    <p>Question {current + 1} of {total} · pass at {session.quiz.passing_score}%</p>
                </div>
                <span className={`quiz-timer ${isLow ? "low" : ""}`}>
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="card question-block">
                <div className="q-title">{question.question_text} <span className="small-muted">({question.marks} mark{question.marks !== 1 ? "s" : ""})</span></div>
                {question.options.map((opt) => (
                    <div
                        key={opt.id}
                        className={`option-row ${answers[question.id] === opt.id ? "selected" : ""}`}
                        onClick={() => selectAnswer(question.id, opt.id)}
                    >
                        <input type="radio" readOnly checked={answers[question.id] === opt.id} style={{ width: "auto" }} />
                        {opt.option_text}
                    </div>
                ))}
            </div>

            <div className="card quiz-nav-card">
                <div className="inline-form-actions">
                    <button className="btn" type="button" disabled={isFirst} onClick={() => setCurrent((c) => c - 1)}>
                        Previous
                    </button>
                    <button className="btn" type="button" disabled={isLast} onClick={() => setCurrent((c) => c + 1)}>
                        Next
                    </button>
                </div>

                <div className="quiz-question-strip">
                    {session.questions.map((q, idx) => (
                        <button
                            key={q.id}
                            type="button"
                            className={`quiz-question-dot ${idx === current ? "active" : ""} ${answers[q.id] ? "answered" : ""}`}
                            onClick={() => setCurrent(idx)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>

                <div className="quiz-nav-footer">
                    <span className="small-muted">{answeredCount} / {total} answered</span>
                    <button className="btn btn-primary" type="button" disabled={submitting} onClick={doSubmit}>
                        {submitting ? "Submitting…" : "Submit quiz"}
                    </button>
                </div>
            </div>
        </div>
    );
}
