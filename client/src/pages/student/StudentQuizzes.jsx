import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api.js";

const DIFFICULTY_PILL = { BEGINNER: "pill-success", INTERMEDIATE: "pill-warning", ADVANCED: "pill-danger" };

export default function StudentQuizzes() {

    const [quizzes, setQuizzes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [sort, setSort] = useState("recent");

    const load = () => {
        const params = {};
        if (search) params.search = search;
        if (categoryId) params.category_id = categoryId;
        if (difficulty) params.difficulty = difficulty;
        if (sort) params.sort = sort;

        api.get("/quizzes", { params })
            .then((res) => setQuizzes(res.data))
            .catch((err) => setError(err.response?.data?.message || "Failed to load quizzes"));
    };

    useEffect(load, [search, categoryId, difficulty, sort]);

    useEffect(() => {
        api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
    }, []);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Browse quizzes</h1>
                    <p>Find a quiz to take.</p>
                </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="card">
                <div className="form-row">
                    <div className="form-group">
                        <label>Search</label>
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Quiz title…" />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            <option value="">All categories</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Difficulty</label>
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                            <option value="">Any</option>
                            <option value="BEGINNER">Beginner</option>
                            <option value="INTERMEDIATE">Intermediate</option>
                            <option value="ADVANCED">Advanced</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Sort</label>
                        <select value={sort} onChange={(e) => setSort(e.target.value)}>
                            <option value="recent">Newest</option>
                            <option value="popular">Most popular</option>
                        </select>
                    </div>
                </div>
            </div>

            {quizzes.length === 0 ? (
                <div className="card"><div className="empty-state">No quizzes match your filters.</div></div>
            ) : (
                <div className="grid grid-2">
                    {quizzes.map((q) => (
                        <div key={q.id} className="card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h3 style={{ margin: 0 }}>{q.title}</h3>
                                <span className={`pill ${DIFFICULTY_PILL[q.difficulty]}`}>{q.difficulty}</span>
                            </div>
                            <p className="small-muted" style={{ minHeight: 20 }}>{q.description || "No description provided."}</p>
                            <p className="small-muted">
                                {q.category_name || "Uncategorized"} · {q.question_count} question{q.question_count !== "1" ? "s" : ""} · {q.duration} min · Pass at {q.passing_score}%
                            </p>
                            <Link className="btn btn-primary" to={`/student/quizzes/${q.id}`}>View details</Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
