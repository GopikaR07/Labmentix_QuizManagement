import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api from "../../api.js";

export default function AdminDashboard() {

    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get("/admin/analytics")
            .then((res) => setData(res.data))
            .catch((err) => setError(err.response?.data?.message || "Failed to load analytics"));
    }, []);

    if (error) return <div className="page"><div className="error-box">{error}</div></div>;
    if (!data) return <div className="loading-text">Loading dashboard…</div>;

    const { stats, charts } = data;

    const trendData = charts.attempts_over_time.map((d) => ({
        date: new Date(d.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        attempts: parseInt(d.count, 10)
    }));

    const topQuizzes = charts.most_popular_quizzes;
    const maxAttempts = Math.max(1, ...topQuizzes.map((q) => q.attempt_count));

    const passFailData = [
        { name: "Passed", value: stats.total_passed },
        { name: "Failed", value: stats.total_failed }
    ];

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Admin dashboard</h1>
                    <p>Platform-wide stats, refreshed on load.</p>
                </div>
            </div>

            <div className="grid grid-3">
                <div className="card stat-card-accent">
                    <div className="stat-date">All time</div>
                    <div className="stat-value">{stats.total_students}</div>
                    <div className="stat-label">Registered Students</div>
                </div>
                <div className="card stat-card-accent">
                    <div className="stat-date">All time</div>
                    <div className="stat-value">{stats.total_attempts}</div>
                    <div className="stat-label">Quiz Attempts</div>
                </div>
                <div className="card stat-card-accent">
                    <div className="stat-date">All time</div>
                    <div className="stat-value">{stats.average_score}%</div>
                    <div className="stat-label">Average Score</div>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginTop: 4 }}>
                <StatCard label="Published quizzes" value={stats.published_quizzes} />
                <StatCard label="Draft quizzes" value={stats.draft_quizzes} />
                <StatCard label="Total questions" value={stats.total_questions} />
                <StatCard label="Passed / Failed" value={`${stats.total_passed} / ${stats.total_failed}`} />
            </div>

            <div className="grid grid-2" style={{ marginTop: 8 }}>
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Top Performing Quizzes</h3>
                    {topQuizzes.length === 0 ? (
                        <p className="small-muted">No attempts yet.</p>
                    ) : (
                        topQuizzes.map((q) => (
                            <div className="top-quiz-row" key={q.id}>
                                <div className="top-quiz-head">
                                    <span>{q.title}</span>
                                    <span>{q.attempt_count} attempts</span>
                                </div>
                                <div className="top-quiz-bar-track">
                                    <div
                                        className="top-quiz-bar-fill"
                                        style={{ width: `${(q.attempt_count / maxAttempts) * 100}%` }}
                                    />
                                </div>
                                <div className="top-quiz-score">
                                    Average score: {parseFloat(q.average_score).toFixed(0)}%
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Most popular categories</h3>
                    {charts.most_popular_categories.length === 0 ? (
                        <p className="small-muted">No attempts yet.</p>
                    ) : (
                        <table>
                            <thead><tr><th>Category</th><th>Attempts</th></tr></thead>
                            <tbody>
                                {charts.most_popular_categories.map((c) => (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>{c.attempt_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="grid grid-2" style={{ marginTop: 8, alignItems: "stretch" }}>
                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Attempts over last 14 days</h3>
                    {trendData.length === 0 ? (
                        <p className="small-muted">No attempts in this window.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6b7280" }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="attempts" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0 }}>Pass / Fail</h3>
                    {stats.total_passed + stats.total_failed === 0 ? (
                        <p className="small-muted">No attempts yet.</p>
                    ) : (
                        <div style={{ position: "relative" }}>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={passFailData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={2}
                                    >
                                        <Cell fill="#16a34a" />
                                        <Cell fill="#dc2626" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={24} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="donut-center-label">
                                <div className="donut-center-value">
                                    {Math.round((stats.total_passed / (stats.total_passed + stats.total_failed)) * 100)}%
                                </div>
                                <div className="small-muted">pass rate</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="card stat-card">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}
