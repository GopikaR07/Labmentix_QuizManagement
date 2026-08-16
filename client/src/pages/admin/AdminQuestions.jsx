import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api.js";

const emptyOption = () => ({ option_text: "", is_correct: false });

const blankForm = () => ({
    question_text: "",
    marks: 1,
    explanation: "",
    difficulty: "BEGINNER",
    options: [emptyOption(), emptyOption()]
});

export default function AdminQuestions() {

    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(blankForm());

    const load = () => {
        api.get(`/quizzes/${quizId}`).then((res) => setQuiz(res.data)).catch(() => {});
        api.get(`/quizzes/${quizId}/questions`).then((res) => setQuestions(res.data)).catch((err) => setError(err.response?.data?.message || "Failed to load questions"));
    };

    useEffect(load, [quizId]);

    const updateOption = (index, field, value) => {
        const options = [...form.options];
        if (field === "is_correct") {
            // single-correct-answer model: selecting one clears the others
            options.forEach((o, i) => { o.is_correct = i === index ? value : false; });
        } else {
            options[index] = { ...options[index], [field]: value };
        }
        setForm({ ...form, options });
    };

    const addOption = () => {
        if (form.options.length >= 6) return;
        setForm({ ...form, options: [...form.options, emptyOption()] });
    };

    const removeOption = (index) => {
        if (form.options.length <= 2) return;
        setForm({ ...form, options: form.options.filter((_, i) => i !== index) });
    };

    const startCreate = () => {
        setEditingId(null);
        setForm(blankForm());
        setShowForm(true);
    };

    const startEdit = (q) => {
        setEditingId(q.id);
        setForm({
            question_text: q.question_text,
            marks: q.marks,
            explanation: q.explanation || "",
            difficulty: q.difficulty,
            options: q.options.map((o) => ({ option_text: o.option_text, is_correct: o.is_correct }))
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (editingId) {
                await api.put(`/questions/${editingId}`, form);
            } else {
                await api.post(`/quizzes/${quizId}/questions`, form);
            }
            setShowForm(false);
            setEditingId(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save question");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this question?")) return;
        try {
            await api.delete(`/questions/${id}`);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete question");
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to="/admin/quizzes" className="small-muted">&larr; Back to quizzes</Link>
                    <h1>{quiz ? quiz.title : "Questions"}</h1>
                    <p>{questions.length} question{questions.length !== 1 ? "s" : ""} · quiz must have at least 1 to publish</p>
                </div>
                <button className="btn btn-primary" onClick={startCreate}>+ New question</button>
            </div>

            {error && <div className="error-box">{error}</div>}

            {showForm && (
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>{editingId ? "Edit question" : "New question"}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Question text</label>
                            <textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Marks</label>
                                <input type="number" min="1" value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} required />
                            </div>
                            <div className="form-group">
                                <label>Difficulty</label>
                                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                                    <option value="BEGINNER">BEGINNER</option>
                                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                                    <option value="ADVANCED">ADVANCED</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Explanation (shown to students after they submit)</label>
                            <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
                        </div>

                        <label>Options (mark exactly one correct)</label>
                        {form.options.map((opt, i) => (
                            <div key={i} className="form-row" style={{ alignItems: "center", marginBottom: 8 }}>
                                <input
                                    type="radio"
                                    name="correct-option"
                                    checked={opt.is_correct}
                                    onChange={() => updateOption(i, "is_correct", true)}
                                    style={{ width: "auto" }}
                                />
                                <input
                                    style={{ flex: 3 }}
                                    value={opt.option_text}
                                    placeholder={`Option ${i + 1}`}
                                    onChange={(e) => updateOption(i, "option_text", e.target.value)}
                                    required
                                />
                                <button type="button" className="btn btn-sm" onClick={() => removeOption(i)} disabled={form.options.length <= 2}>Remove</button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-sm" onClick={addOption} disabled={form.options.length >= 6}>+ Add option</button>

                        <div className="inline-form-actions" style={{ marginTop: 16 }}>
                            <button className="btn btn-primary" type="submit">Save question</button>
                            <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                {questions.length === 0 ? (
                    <div className="empty-state">No questions yet — add one above.</div>
                ) : (
                    questions.map((q, idx) => (
                        <div key={q.id} className="question-block" style={{ borderBottom: idx < questions.length - 1 ? "1px solid var(--border)" : "none", paddingBottom: 16 }}>
                            <div className="q-title">{idx + 1}. {q.question_text} <span className="small-muted">({q.marks} mark{q.marks !== 1 ? "s" : ""})</span></div>
                            {q.options.map((o) => (
                                <div key={o.id} className={`option-row ${o.is_correct ? "correct" : ""}`} style={{ cursor: "default" }}>
                                    {o.option_text}
                                </div>
                            ))}
                            <div className="inline-form-actions">
                                <button className="btn btn-sm" onClick={() => startEdit(q)}>Edit</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(q.id)}>Delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
