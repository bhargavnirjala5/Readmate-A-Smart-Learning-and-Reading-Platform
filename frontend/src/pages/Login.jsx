import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Save the login session
  const saveLoginSession = (data) => {
    if (!data.token || !data.user) {
      throw new Error("Authentication response is incomplete.");
    }

    const userData = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
    };

    localStorage.removeItem("readmate_token");
    localStorage.removeItem("readmate_user");
    sessionStorage.removeItem("readmate_token");
    sessionStorage.removeItem("readmate_user");

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("readmate_token", data.token);
    storage.setItem("readmate_user", JSON.stringify(userData));

    navigate("/", { replace: true });
  };

  // Email and password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      saveLoginSession(data);
    } catch (err) {
      console.error("Login Error:", err);

      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error("Google did not return a login credential.");
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google login failed.");
      }

      saveLoginSession(data);
    } catch (err) {
      console.error("Google Login Error:", err);

      setError(
        err.message || "Google login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-background-shape shape-one"></div>
      <div className="login-background-shape shape-two"></div>

      <section className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <BookOpen size={24} strokeWidth={2} />
          </div>

          <span>
            Read<span>mate</span>
          </span>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>
            Welcome Back
            <span>✦</span>
          </h1>

          <p>Log in to continue your reading journey.</p>
        </div>

        {/* Email and password form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-wrapper">
            <Mail size={19} />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-input-wrapper">
            <Lock size={19} />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label="Show or hide password"
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                color: "#c45132",
                fontSize: "13px",
                margin: "10px 2px 0",
              }}
            >
              {error}
            </p>
          )}

          <div className="login-options">
            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              <span>Remember me</span>
            </label>

            <button
              type="button"
              className="forgot-button"
              onClick={() =>
                setError("Password recovery is not available yet.")
              }
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            <span>{loading ? "Logging in..." : "Login"}</span>
            <ArrowRight size={19} />
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <span></span>
          <p>OR</p>
          <span></span>
        </div>

        {/* Google Sign-In */}
        <div
          className="google-login-container"
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            minHeight: "42px",
          }}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError("Google sign-in was cancelled or failed.");
            }}
            theme="outline"
            shape="rectangular"
            size="large"
            text="continue_with"
            width="320"
            useOneTap={false}
          />
        </div>

        <div className="signup-text">
          <span>Don't have an account?</span>
          <Link to="/signup">Sign up</Link>
        </div>

        <p className="login-footer">
          Your reading space, whenever you need it.
        </p>
      </section>
    </main>
  );
}

export default Login;