import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  BookOpen,
  Home as HomeIcon,
  LayoutDashboard,
  Bookmark,
  Moon,
  Sun,
  User,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";

import { useState, useEffect, useRef } from "react";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const profileRef = useRef(null);

  const isLoggedIn = Boolean(
    localStorage.getItem("readmate_token") ||
      sessionStorage.getItem("readmate_token")
  );

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  // Close the profile menu when clicking outside it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Open the logout confirmation dialog
  const handleLogout = () => {
    setProfileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  // Log out only after confirmation
  const confirmLogout = () => {
    localStorage.removeItem("readmate_token");
    localStorage.removeItem("readmate_user");

    sessionStorage.removeItem("readmate_token");
    sessionStorage.removeItem("readmate_user");

    setShowLogoutConfirm(false);

    navigate("/login", { replace: true });
  };

  // Close the confirmation dialog
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Close dialog using the Escape key
  useEffect(() => {
    if (!showLogoutConfirm) {
      return;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        cancelLogout();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showLogoutConfirm]);

  return (
    <>
      <nav className="navbar">
        {/* LOGO */}
        <Link to="/" className="logo">
          <span className="logo-icon">
            <BookOpen size={20} strokeWidth={2} />
          </span>

          <span>
            Read<span>mate</span>
          </span>
        </Link>

        {/* NAVIGATION LINKS */}
        <div className="nav-links">
          <Link
            to="/"
            className={isActive("/") ? "active" : ""}
          >
            <HomeIcon size={15} />
            <span>Home</span>
          </Link>

          <Link
            to="/books"
            className={isActive("/books") ? "active" : ""}
          >
            <BookOpen size={15} />
            <span>My Books</span>
          </Link>

          <Link
            to="/dashboard"
            className={isActive("/dashboard") ? "active" : ""}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/bookmarks"
            className={isActive("/bookmarks") ? "active" : ""}
          >
            <Bookmark size={15} />
            <span>Bookmarks</span>
          </Link>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="nav-actions">
          {/* THEME BUTTON */}
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            title={darkMode ? "Light Mode" : "Dark Mode"}
            aria-label={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? (
              <Sun size={17} />
            ) : (
              <Moon size={17} />
            )}
          </button>

          {/* PROFILE MENU */}
          <div
            className="profile-menu-container"
            ref={profileRef}
          >
            <button
              type="button"
              className="profile-button"
              onClick={() =>
                setProfileMenuOpen((prev) => !prev)
              }
              title="Account menu"
              aria-label="Account menu"
              aria-expanded={profileMenuOpen}
            >
              <User size={17} />
              <ChevronDown size={13} />
            </button>

            {profileMenuOpen && (
              <div className="profile-dropdown">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="profile-dropdown-item"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>

                    <button
                      type="button"
                      className="profile-dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="profile-dropdown-item"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <User size={16} />
                      <span>Login</span>
                    </Link>

                    <Link
                      to="/signup"
                      className="profile-dropdown-item"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <BookOpen size={16} />
                      <span>Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* LOGOUT CONFIRMATION DIALOG */}
      {showLogoutConfirm && (
        <div
          className="logout-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cancelLogout();
            }
          }}
        >
          <section
            className="logout-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
          >
            {/* CLOSE BUTTON */}
            <button
              type="button"
              className="logout-modal-close"
              onClick={cancelLogout}
              aria-label="Close confirmation"
            >
              <X size={18} />
            </button>

            {/* ICON */}
            <div className="logout-modal-icon">
              <LogOut size={25} />
            </div>

            {/* HEADING */}
            <h2 id="logout-modal-title">
              Confirm Logout
            </h2>

            {/* MESSAGE */}
            <p id="logout-modal-description">
              Are you sure you want to log out of your
              Readmate account?
            </p>

            {/* ACTION BUTTONS */}
            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel-button"
                onClick={cancelLogout}
              >
                Cancel
              </button>

              <button
                type="button"
                className="logout-confirm-button"
                onClick={confirmLogout}
              >
                <LogOut size={15} />
                Yes, Logout
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default Navbar;