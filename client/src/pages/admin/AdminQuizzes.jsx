import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api.js";

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const STATUS_PILL = { PUBLISHED: "pill-success", DRAFT: "pill-neutral", UNPUBLISHED: "pill-warning" };

export default function AdminQuizzes() {

    const [quizzes, setQuizzes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        title: "", description: "", category_id: "", difficulty: "BEGINNER",
        duration: 15, passing_score: 60, max_attempts: 1
    });

    const load = () => {
        api.get("/quizzes").then((res) => setQuizzes(res.data)).catch((err) => setError(err.response?.data?.message || "Failed to load quizzes"));
        api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
    };

    useEffect(load, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/quizzes", {
                ...form,
                category_id: form.category_id || null,
                duration: Number(form.duration),
                passing_score: Number(form.passing_score),
                max_attempts: Number(form.max_attempts)
            });
            setForm({ title: "", description: "", category_id: "", difficulty: "BEGINNER", duration: 15, passing_score: 60, max_attempts: 1 });
            setShowForm(false);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create quiz");
        }
    };

    const setStatus = async (id, status) => {
        setError("");
        try {
            await api.patch(`/quizzes/${id}/publish`, { status });
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this quiz? This also removes its questions and attempts.")) return;
        try {
            await api.delete(`/quizzes/${id}`);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete quiz");
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Quizzes</h1>
                    <p>Create, publish, and manage quizzes.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
                    {showForm ? "Cancel" : "+ New quiz"}
                </button>
            </div>

            <p className="small-muted" style={{ marginTop: -12, marginBottom: 16 }}>
                {quizzes.filter((q) => q.status === "PUBLISHED").length} published ·{" "}
                {quizzes.filter((q) => q.status === "DRAFT").length} draft ·{" "}
                {quizzes.filter((q) => q.status === "UNPUBLISHED").length} unpublished
            </p>

            {error && <div className="error-box">{error}</div>}

            {showForm && (
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>New quiz</h3>
                    <form onSubmit={handleCreate}>
                        <div className="form-group">
                            <label>Title</label>
                            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                    <option value="">Uncategorized</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Difficulty</label>
                                <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                                    {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Duration (minutes)</label>
                                <input type="number" min="1" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Passing score (%)</label>
                                <input type="number" min="0" max="100" value={form.passing_score} onChange={(e) => setForm({ ...form, passing_score: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Max attempts</label>
                                <input type="number" min="1" value={form.max_attempts} onChange={(e) => setForm({ ...form, max_attempts: e.target.value })} required />
                            </div>
                        </div>
                        <button className="btn btn-primary" type="submit">Create quiz (starts as draft)</button>
                    </form>
                </div>
            )}

            <div className="card">
                {quizzes.length === 0 ? (
                    <div className="empty-state">No quizzes yet — create one above.</div>
                ) : (
                    <table>
                        <thead>
                            <tr><th>Title</th><th>Category</th><th>Questions</th><th>Status</th><th></th></tr>
                        </thead>
                        <tbody>
                            {quizzes.map((q) => (
                                <tr key={q.id}>
                                    <td><Link to={`/admin/quizzes/${q.id}/questions`}>{q.title}</Link></td>
                                    <td>{q.category_name || "—"}</td>
                                    <td>{q.question_count}</td>
                                    <td><span className={`pill ${STATUS_PILL[q.status]}`}>{q.status}</span></td>
                                    <td>
                                        <div className="inline-form-actions">
                                            <Link className="btn btn-sm" to={`/admin/quizzes/${q.id}/questions`}>Questions</Link>
                                            {q.status !== "PUBLISHED" && (
                                                <button className="btn btn-sm btn-primary" onClick={() => setStatus(q.id, "PUBLISHED")}>Publish</button>
                                            )}
                                            {q.status === "PUBLISHED" && (
                                                <button className="btn btn-sm" onClick={() => setStatus(q.id, "UNPUBLISHED")}>Unpublish</button>
                                            )}
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(q.id)}>Delete</button>
                                        </div>
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
