import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

export default function ForgotPassword() {

    const [step, setStep] = useState("request"); // request | reset | done
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);

    const requestReset = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const { data } = await api.post("/auth/forgot-password", { email });
            setInfo(data.message);
            // Backend has no email service wired up yet, so it hands the
            // token straight back for testing — prefill it so the flow is
            // click-through-able end to end.
            if (data.dev_reset_token) {
                setToken(data.dev_reset_token);
            }
            setStep("reset");
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const submitReset = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.post("/auth/reset-password", { token, new_password: newPassword });
            setStep("done");
        } catch (err) {
            setError(err.response?.data?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrap">
            <div className="card auth-card">
                <h1>Reset password</h1>
                <p className="subtitle">
                    {step === "request" && "Enter your account email to get a reset token."}
                    {step === "reset" && "Enter the token and your new password."}
                    {step === "done" && "Your password has been updated."}
                </p>

                {error && <div className="error-box">{error}</div>}
                {info && step === "reset" && <div className="success-box">{info}</div>}

                {step === "request" && (
                    <form onSubmit={requestReset}>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                        </div>
                        <button className="btn btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
                            {loading ? "Sending…" : "Send reset token"}
                        </button>
                    </form>
                )}

                {step === "reset" && (
                    <form onSubmit={submitReset}>
                        <div className="form-group">
                            <label>Reset token</label>
                            <input value={token} onChange={(e) => setToken(e.target.value)} required />
                            <p className="small-muted">No email service is wired up yet, so the token is pre-filled here for testing — this field won't be exposed once that's added.</p>
                        </div>
                        <div className="form-group">
                            <label>New password</label>
                            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                        </div>
                        <button className="btn btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
                            {loading ? "Resetting…" : "Reset password"}
                        </button>
                    </form>
                )}

                {step === "done" && (
                    <Link to="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                        Go to login
                    </Link>
                )}

                <p className="small-muted" style={{ marginTop: 16 }}>
                    <Link to="/login">Back to login</Link>
                </p>
            </div>
        </div>
    );
}
