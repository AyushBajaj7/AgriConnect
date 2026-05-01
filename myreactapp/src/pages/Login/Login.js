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
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();
  const { signIn, registerUser } = useAuth();

  /** Sync form field changes and clear any existing error. */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (isRegistering) {
      result = await registerUser(form.username, form.password);
    } else {
      result = await signIn(form.username, form.password);
    }

    if (result.success) {
      navigate("/dashboard", { replace: true });
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
          <span className="login-icon">AG</span>
          <h1 className="login-title">AgriConnect</h1>
          <p className="login-subtitle">
            {isRegistering 
              ? "Create a new account to access the platform."
              : "Sign in to access the operational dashboard and AI assistant."}
          </p>
        </div>

        <div className="login-security-note">
          Session access is handled server-side with secure cookies. Configure
          the administrator credentials on the backend before deployment.
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
            {loading ? (isRegistering ? "Registering..." : "Signing in...") : (isRegistering ? "Register" : "Sign in")}
          </button>
        </form>

        <div className="login-toggle">
          {isRegistering ? "Already have an account? " : "Don't have an account? "}
          <button 
            type="button" 
            className="btn-link"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
          >
            {isRegistering ? "Sign in here" : "Register here"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
