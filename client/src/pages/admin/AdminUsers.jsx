import { useEffect, useState } from "react";
import api from "../../api.js";

export default function AdminUsers() {

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);

    const load = (q = "") => {
        api.get("/users", { params: q ? { search: q } : {} })
            .then((res) => setUsers(res.data))
            .catch((err) => setError(err.response?.data?.message || "Failed to load students"));
    };

    useEffect(() => load(), []);

    const handleSearch = (e) => {
        e.preventDefault();
        load(search);
    };

    const toggleStatus = async (u) => {
        const nextStatus = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        try {
            await api.patch(`/users/${u.id}/status`, { status: nextStatus });
            load(search);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this student account? This cannot be undone.")) return;
        try {
            await api.delete(`/users/${id}`);
            load(search);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete student");
        }
    };

    const viewDetail = async (id) => {
        const { data } = await api.get(`/users/${id}`);
        setSelected(data);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Students</h1>
                    <p>
                        {users.length} registered ·{" "}
                        {users.filter((u) => u.status === "ACTIVE").length} active ·{" "}
                        {users.filter((u) => u.status === "INACTIVE").length} inactive
                    </p>
                </div>
                <form onSubmit={handleSearch} className="form-row" style={{ margin: 0 }}>
                    <input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <button className="btn btn-sm">Search</button>
                </form>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="card">
                {users.length === 0 ? (
                    <div className="empty-state">No students found.</div>
                ) : (
                    <table>
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Attempted</th><th>Avg score</th><th>Status</th><th></th></tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td><a onClick={() => viewDetail(u.id)} style={{ cursor: "pointer" }}>{u.name}</a></td>
                                    <td>{u.email}</td>
                                    <td>{u.quizzes_attempted}</td>
                                    <td>{u.average_score}%</td>
                                    <td><span className={`pill ${u.status === "ACTIVE" ? "pill-success" : "pill-neutral"}`}>{u.status}</span></td>
                                    <td>
                                        <div className="inline-form-actions">
                                            <button className="btn btn-sm" onClick={() => toggleStatus(u)}>
                                                {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                                            </button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selected && (
                <div className="card">
                    <div className="page-header" style={{ marginBottom: 12 }}>
                        <h3 style={{ margin: 0 }}>{selected.name}'s quiz history</h3>
                        <button className="btn btn-sm" onClick={() => setSelected(null)}>Close</button>
                    </div>
                    {selected.quiz_history.length === 0 ? (
                        <p className="small-muted">No attempts yet.</p>
                    ) : (
                        <table>
                            <thead><tr><th>Quiz</th><th>Score</th><th>Status</th><th>Date</th></tr></thead>
                            <tbody>
                                {selected.quiz_history.map((h) => (
                                    <tr key={h.id}>
                                        <td>{h.quiz_title}</td>
                                        <td>{h.percentage ? `${h.percentage}%` : "—"}</td>
                                        <td><span className={`pill ${h.status === "PASSED" ? "pill-success" : h.status === "FAILED" ? "pill-danger" : "pill-neutral"}`}>{h.status}</span></td>
                                        <td>{h.completed_at ? new Date(h.completed_at).toLocaleString() : "In progress"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
