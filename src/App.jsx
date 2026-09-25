import { BrowserRouter, Routes, Route } from "react-router-dom";

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

import Navbar from "./components/Navbar";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">

        <Navbar />

        <Routes>

          {/* =========================
              HOME
          ========================= */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* =========================
              BOOK LIBRARY
          ========================= */}
          <Route
            path="/books"
            element={<Books />}
          />

          {/* =========================
              BOOK INFORMATION
          ========================= */}
          <Route
            path="/book/:bookId"
            element={<BookInfo />}
          />

          {/* =========================
              BOOK INDEX
          ========================= */}
          <Route
            path="/book/:bookId/index"
            element={<BookIndex />}
          />

          {/* =========================
              NORMAL BOOK READER
          ========================= */}
          <Route
            path="/book/:bookId/read"
            element={<Reader />}
          />

          <Route
            path="/book/:bookId/read/:chapterId"
            element={<Reader />}
          />

          {/* =========================
              SCANNED BOOK READER
              
              This is kept separate
              from normal books.
          ========================= */}
          <Route
            path="/scanned-reader"
            element={<Reader />}
          />

          {/* =========================
              DASHBOARD
          ========================= */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* =========================
              BOOKMARKS
          ========================= */}
          <Route
            path="/bookmarks"
            element={<Bookmarks />}
          />

          {/* =========================
              NOTES
          ========================= */}
          <Route
            path="/notes"
            element={<Notes />}
          />

          {/* =========================
              PDF UPLOAD
          ========================= */}
          <Route
            path="/upload"
            element={<Upload />}
          />

          {/* =========================
              PDF READER
          ========================= */}
          <Route
            path="/pdf-reader"
            element={<PdfReader />}
          />

          {/* =========================
              CAMERA SCAN
          ========================= */}
          <Route
            path="/scan"
            element={<Scan />}
          />

          {/* =========================
              FALLBACK
          ========================= */}
          <Route
            path="*"
            element={<Home />}
          />

        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;