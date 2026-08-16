import { useEffect, useState } from "react";
import api from "../../api.js";

export default function AdminCategories() {

    const [categories, setCategories] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const load = () => {
        api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
    };

    useEffect(load, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/categories", { name, description });
            setName("");
            setDescription("");
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create category");
        }
    };

    const startEdit = (cat) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditDescription(cat.description || "");
    };

    const saveEdit = async (id) => {
        setError("");
        try {
            await api.put(`/categories/${id}`, { name: editName, description: editDescription });
            setEditingId(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update category");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this category? Quizzes in it will be uncategorized.")) return;
        try {
            await api.delete(`/categories/${id}`);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete category");
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Categories</h1>
                    <p>Group quizzes by topic.</p>
                </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="card">
                <h3 style={{ marginTop: 0 }}>Add category</h3>
                <form onSubmit={handleCreate} className="form-row" style={{ alignItems: "flex-end" }}>
                    <div className="form-group">
                        <label>Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <input value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: "none" }}>
                        <button className="btn btn-primary" type="submit">Add</button>
                    </div>
                </form>
            </div>

            <div className="card">
                {categories.length === 0 ? (
                    <div className="empty-state">No categories yet — add one above.</div>
                ) : (
                    <table>
                        <thead>
                            <tr><th>Name</th><th>Description</th><th>Published quizzes</th><th></th></tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id}>
                                    {editingId === cat.id ? (
                                        <>
                                            <td><input value={editName} onChange={(e) => setEditName(e.target.value)} /></td>
                                            <td><input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} /></td>
                                            <td>{cat.quiz_count}</td>
                                            <td>
                                                <div className="inline-form-actions">
                                                    <button className="btn btn-sm btn-primary" onClick={() => saveEdit(cat.id)}>Save</button>
                                                    <button className="btn btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{cat.name}</td>
                                            <td>{cat.description || "—"}</td>
                                            <td>{cat.quiz_count}</td>
                                            <td>
                                                <div className="inline-form-actions">
                                                    <button className="btn btn-sm" onClick={() => startEdit(cat)}>Edit</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id)}>Delete</button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
