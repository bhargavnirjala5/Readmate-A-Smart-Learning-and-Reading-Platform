import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  Home as HomeIcon,
  LayoutDashboard,
  Bookmark,
  Moon,
  Sun,
  User
} from "lucide-react";
import { useState } from "react";

function Navbar() {
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(false);

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <nav className="navbar">

      {/* ================= LOGO ================= */}
      <Link to="/" className="logo">
        <span className="logo-icon">
          <BookOpen size={20} strokeWidth={2} />
        </span>

        <span>
          Read<span>mate</span>
        </span>
      </Link>


      {/* ================= NAV LINKS ================= */}
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


      {/* ================= RIGHT ACTIONS ================= */}
      <div className="nav-actions">

        {/* THEME BUTTON */}
        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? (
            <Sun size={17} />
          ) : (
            <Moon size={17} />
          )}
        </button>


        {/* PROFILE BUTTON */}
        <Link
          to="/dashboard"
          className="profile-button"
          title="Profile"
        >
          <User size={17} />
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;