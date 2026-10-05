import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Demo login credentials
    const correctEmail = "student@gmail.com";
    const correctPassword = "123456";

    if (email === correctEmail && password === correctPassword) {
      setError("");

      // Go to Home page after successful login
      navigate("/");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <main className="login-page">

      {/* Background decoration */}
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

          <p>
            Log in to continue your reading journey.
          </p>

        </div>


        {/* Login Form */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

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
              }}
              required
            />

          </div>


          {/* Password */}
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
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              aria-label="Show or hide password"
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>

          </div>


          {/* Error message */}
          {error && (
            <p
              style={{
                color: "#c45132",
                fontSize: "13px",
                margin: "10px 2px 0",
              }}
            >
              {error}
            </p>
          )}


          {/* Remember + Forgot */}
          <div className="login-options">

            <label className="remember-option">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              <span>Remember me</span>

            </label>

            <button
              type="button"
              className="forgot-button"
            >
              Forgot password?
            </button>

          </div>


          {/* Login Button */}
          <button
            type="submit"
            className="login-button"
          >

            <span>Login</span>

            <ArrowRight size={19} />

          </button>

        </form>


        {/* Divider */}
        <div className="login-divider">

          <span></span>

          <p>OR</p>

          <span></span>

        </div>


        {/* Google Button */}
        <button
          type="button"
          className="google-button"
        >

          <svg
            className="google-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >

            <path
              fill="#4285F4"
              d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26Z"
            />

            <path
              fill="#34A853"
              d="M12 21.84c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.84Z"
            />

            <path
              fill="#FBBC05"
              d="M6.54 13.93a5.86 5.86 0 0 1 0-3.86V7.54H3.3a9.84 9.84 0 0 0 0 8.92l3.24-2.53Z"
            />

            <path
              fill="#EA4335"
              d="M12 6.04c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.14 14.63 2.16 12 2.16a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53C7.31 7.76 9.46 6.04 12 6.04Z"
            />

          </svg>

          <span>Continue with Google</span>

        </button>


        {/* Sign up */}
        <div className="signup-text">

          <span>Don't have an account?</span>

          <button type="button">
            Sign up
          </button>

        </div>


        {/* Footer */}
        <p className="login-footer">
          Your reading space, whenever you need it.
        </p>

      </section>

    </main>
  );
}

export default Login;