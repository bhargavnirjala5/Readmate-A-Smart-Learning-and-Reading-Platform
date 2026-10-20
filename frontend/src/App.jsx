import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Books from "./pages/Books";
import BookInfo from "./pages/BookInfo";
import BookIndex from "./pages/BookIndex";
import Reader from "./pages/Reader";

import Dashboard from "./pages/Dashboard";
import Bookmarks from "./pages/Bookmarks";
import Notes from "./pages/Notes";

import Upload from "./pages/Upload";
import PdfReader from "./pages/PdfReader";
import Scan from "./pages/Scan";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Navbar from "./components/Navbar";

import "./App.css";

// Check whether a login token exists
function isLoggedIn() {
  return Boolean(
    localStorage.getItem("readmate_token") ||
    sessionStorage.getItem("readmate_token")
  );
}

// Protect pages that require login
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Redirect logged-in users away from Login and Signup
function PublicAuthRoute({ children }) {
  if (isLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <div className="app">
      {!isAuthPage && <Navbar />}

      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={
            <PublicAuthRoute>
              <Login />
            </PublicAuthRoute>
          }
        />

        {/* SIGNUP */}
        <Route
          path="/signup"
          element={
            <PublicAuthRoute>
              <Signup />
            </PublicAuthRoute>
          }
        />

        {/* HOME — LOGIN REQUIRED */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* BOOK LIBRARY */}
        <Route
          path="/books"
          element={
            <ProtectedRoute>
              <Books />
            </ProtectedRoute>
          }
        />

        {/* BOOK INFORMATION */}
        <Route
          path="/book/:bookId"
          element={
            <ProtectedRoute>
              <BookInfo />
            </ProtectedRoute>
          }
        />

        {/* BOOK INDEX */}
        <Route
          path="/book/:bookId/index"
          element={
            <ProtectedRoute>
              <BookIndex />
            </ProtectedRoute>
          }
        />

        {/* NORMAL BOOK READER */}
        <Route
          path="/book/:bookId/read"
          element={
            <ProtectedRoute>
              <Reader />
            </ProtectedRoute>
          }
        />

        <Route
          path="/book/:bookId/read/:chapterId"
          element={
            <ProtectedRoute>
              <Reader />
            </ProtectedRoute>
          }
        />

        {/* SCANNED BOOK READER */}
        <Route
          path="/scanned-reader"
          element={
            <ProtectedRoute>
              <Reader />
            </ProtectedRoute>
          }
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* BOOKMARKS */}
        <Route
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <Bookmarks />
            </ProtectedRoute>
          }
        />

        {/* NOTES */}
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          }
        />

        {/* PDF UPLOAD */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />

        {/* PDF READER */}
        <Route
          path="/pdf-reader"
          element={
            <ProtectedRoute>
              <PdfReader />
            </ProtectedRoute>
          }
        />

        {/* CAMERA SCAN */}
        <Route
          path="/scan"
          element={
            <ProtectedRoute>
              <Scan />
            </ProtectedRoute>
          }
        />

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={
            <Navigate
              to={isLoggedIn() ? "/" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;