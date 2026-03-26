/**
 * File: Login.js
 * Description: Renders the full-page login form for AgriConnect.
 *              Validates credentials via authService and redirects
 *              to /dashboard on success.
 *
 * State:
 *   form     — { username, password } controlled input values
 *   error    — validation / auth error message to display
 *   loading  — disables the submit button while auth is processing
 *
 * Used in: App.js (route /login)
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/authService";
import "./Login.css";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /** Sync form field changes and clear any existing error. */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  /** Submit the form — calls authService and navigates or displays error. */
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const result = login(form.username, form.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative background glow */}
      <div className="login-glow" />

      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">🌾</span>
          <h1 className="login-title">AgriConnect</h1>
          <p className="login-subtitle">Sign in to your farmer portal</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="login-hint">
          Demo credentials: <strong>admin</strong> /{" "}
          <strong>password123</strong>
        </p>
      </div>
    </div>
  );
}

export default Login;
