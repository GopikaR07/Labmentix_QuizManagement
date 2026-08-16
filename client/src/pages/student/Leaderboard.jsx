import { useEffect, useState } from "react";
import api from "../../api.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Leaderboard() {

    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");
    const [period, setPeriod] = useState("overall");
    const [sort, setSort] = useState("average");

    useEffect(() => {
        api.get("/leaderboard", { params: { period, sort } })
            .then((res) => setRows(res.data))
            .catch((err) => setError(err.response?.data?.message || "Failed to load leaderboard"));
    }, [period, sort]);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Leaderboard</h1>
                    <p>Top students by performance.</p>
                </div>
            </div>

            <div className="card" style={{ display: "flex", gap: 16 }}>
                <div className="form-group" style={{ flex: "none", minWidth: 160 }}>
                    <label>Period</label>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <option value="overall">All time</option>
                        <option value="monthly">Last 30 days</option>
                        <option value="weekly">Last 7 days</option>
                    </select>
                </div>
                <div className="form-group" style={{ flex: "none", minWidth: 160 }}>
                    <label>Sort by</label>
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="average">Average score</option>
                        <option value="highest">Highest score</option>
                        <option value="completed">Quizzes completed</option>
                    </select>
                </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="card">
                {rows.length === 0 ? (
                    <div className="empty-state">No completed attempts in this period yet.</div>
                ) : (
                    <table>
                        <thead><tr><th>Rank</th><th>Student</th><th>Completed</th><th>Avg score</th><th>Highest</th></tr></thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.user_id} style={r.user_id === user?.id ? { background: "#eef2ff" } : undefined}>
                                    <td>#{r.rank}</td>
                                    <td>{r.student_name}{r.user_id === user?.id ? " (you)" : ""}</td>
                                    <td>{r.quizzes_completed}</td>
                                    <td>{r.average_score}%</td>
                                    <td>{r.highest_score}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
