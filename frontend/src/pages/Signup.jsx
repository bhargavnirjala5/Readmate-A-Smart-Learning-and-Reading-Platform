import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import "./Login.css";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create your account.");
        return;
      }

      setSuccess("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Signup Error:", error);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
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
            Create Account <span>✦</span>
          </h1>

          <p>Join Readmate and start your reading journey.</p>
        </div>

        {/* Signup Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="login-input-wrapper">
            <User size={19} />

            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
                setSuccess("");
              }}
              autoComplete="name"
              required
            />
          </div>

          {/* Email */}
          <div className="login-input-wrapper">
            <Mail size={19} />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                setSuccess("");
              }}
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div className="login-input-wrapper">
            <Lock size={19} />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (minimum 6 characters)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
                setSuccess("");
              }}
              autoComplete="new-password"
              minLength={6}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Show or hide password"
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="login-input-wrapper">
            <Lock size={19} />

            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
                setSuccess("");
              }}
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              aria-label="Show or hide confirm password"
            >
              {showConfirmPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {/* Error Message */}
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

          {/* Success Message */}
          {success && (
            <p
              role="status"
              style={{
                color: "#26834a",
                fontSize: "13px",
                margin: "10px 2px 0",
              }}
            >
              {success}
            </p>
          )}

          {/* Signup Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            <span>{loading ? "Creating account..." : "Sign up"}</span>

            <ArrowRight size={19} />
          </button>
        </form>

        {/* Login Link */}
        <div className="signup-text">
          <span>Already have an account?</span>

          <Link to="/login">Log in</Link>
        </div>

        {/* Footer */}
        <p className="login-footer">
          Your reading space, whenever you need it.
        </p>
      </section>
    </main>
  );
}

export default Signup;