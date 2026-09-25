import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  BookOpen,
  ArrowRight,
  Trash2,
  Clock3,
  FileText,
  Play,
  Search,
  X,
  Sparkles,
} from "lucide-react";
import "../App.css";

const STORAGE_KEY = "readly_bookmarks";
const DATA_EVENT = "readly-data-updated";

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState("All Books");

  // =====================================================
  // LOAD BOOKMARKS
  // =====================================================

  const loadBookmarks = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setBookmarks([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setBookmarks([]);
        return;
      }

      setBookmarks(parsed);
    } catch (error) {
      console.error("Unable to load bookmarks:", error);
      setBookmarks([]);
    }
  };

  // =====================================================
  // LOAD + LISTEN FOR CHANGES
  // =====================================================

  useEffect(() => {
    loadBookmarks();

    const handleBookmarkUpdate = () => {
      loadBookmarks();
    };

    window.addEventListener(DATA_EVENT, handleBookmarkUpdate);
    window.addEventListener("storage", handleBookmarkUpdate);

    return () => {
      window.removeEventListener(
        DATA_EVENT,
        handleBookmarkUpdate
      );

      window.removeEventListener(
        "storage",
        handleBookmarkUpdate
      );
    };
  }, []);

  // =====================================================
  // DELETE ONE BOOKMARK
  // =====================================================

  const deleteBookmark = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this bookmark?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const updatedBookmarks = bookmarks.filter(
        (bookmark) => bookmark.id !== id
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedBookmarks)
      );

      setBookmarks(updatedBookmarks);

      window.dispatchEvent(
        new Event(DATA_EVENT)
      );
    } catch (error) {
      console.error("Unable to delete bookmark:", error);
    }
  };

  // =====================================================
  // CLEAR ALL BOOKMARKS
  // =====================================================

  const clearAllBookmarks = () => {
    if (bookmarks.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove all bookmarks?"
    );

    if (!confirmed) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([])
      );

      setBookmarks([]);

      window.dispatchEvent(
        new Event(DATA_EVENT)
      );
    } catch (error) {
      console.error(
        "Unable to clear bookmarks:",
        error
      );
    }
  };

  // =====================================================
  // BOOK FILTER
  // =====================================================

  const bookNames = useMemo(() => {
    const names = bookmarks
      .map((bookmark) => bookmark.book)
      .filter(Boolean);

    return ["All Books", ...new Set(names)];
  }, [bookmarks]);

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredBookmarks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookmarks.filter((bookmark) => {
      const bookName = String(
        bookmark.book || ""
      ).toLowerCase();

      const chapterName = String(
        bookmark.chapter || ""
      ).toLowerCase();

      const bookmarkText = String(
        bookmark.text || ""
      ).toLowerCase();

      const matchesBook =
        selectedBook === "All Books" ||
        bookmark.book === selectedBook;

      const matchesSearch =
        !query ||
        bookName.includes(query) ||
        chapterName.includes(query) ||
        bookmarkText.includes(query);

      return matchesBook && matchesSearch;
    });
  }, [bookmarks, search, selectedBook]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalBookmarks = bookmarks.length;

  const totalBooks = new Set(
    bookmarks
      .map((bookmark) => bookmark.book)
      .filter(Boolean)
  ).size;

  const totalPassages = bookmarks.filter(
    (bookmark) => bookmark.text
  ).length;

  return (
    <main className="bookmarks-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="bookmarks-hero">

        <div className="bookmarks-badge">
          <Sparkles size={15} />
          YOUR SAVED READING
        </div>

        <h1>
          Your Bookmarks
        </h1>

        <p>
          Keep the pages, ideas, and moments you love
          close. Come back to them whenever you want.
        </p>

      </section>


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="bookmark-summary">

        {/* SAVED BOOKMARKS */}

        <div className="bookmark-summary-card">

          <div className="summary-icon">
            <Bookmark size={21} />
          </div>

          <div>
            <strong>
              {totalBookmarks}
            </strong>

            <span>
              Saved Bookmarks
            </span>
          </div>

        </div>


        {/* BOOKS */}

        <div className="bookmark-summary-card">

          <div className="summary-icon">
            <BookOpen size={21} />
          </div>

          <div>
            <strong>
              {totalBooks}
            </strong>

            <span>
              Books
            </span>
          </div>

        </div>


        {/* PASSAGES */}

        <div className="bookmark-summary-card">

          <div className="summary-icon">
            <FileText size={21} />
          </div>

          <div>
            <strong>
              {totalPassages}
            </strong>

            <span>
              Saved Passages
            </span>
          </div>

        </div>

      </section>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="bookmarks-content">

        {/* HEADING */}

        <div className="bookmarks-heading">

          <div>

            <span>
              SAVED PAGES
            </span>

            <h2>
              Continue where you left off
            </h2>

          </div>

          <Link
            to="/books"
            className="bookmarks-explore-link"
          >
            Explore Books
            <ArrowRight size={16} />
          </Link>

        </div>


        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <div className="bookmark-tools">

          <div className="bookmark-search">

            <Search size={17} />

            <input
              type="text"
              placeholder="Search bookmarks..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}

          </div>


          <select
            value={selectedBook}
            onChange={(event) =>
              setSelectedBook(event.target.value)
            }
            className="bookmark-filter"
          >
            {bookNames.map((bookName) => (
              <option
                key={bookName}
                value={bookName}
              >
                {bookName}
              </option>
            ))}
          </select>


          {bookmarks.length > 0 && (
            <button
              type="button"
              className="clear-bookmarks-button"
              onClick={clearAllBookmarks}
            >
              <Trash2 size={15} />
              Clear All
            </button>
          )}

        </div>


        {/* =================================================
            BOOKMARK LIST
        ================================================= */}

        {filteredBookmarks.length > 0 ? (

          <div className="bookmark-list">

            {filteredBookmarks.map((bookmark) => (

              <article
                className="bookmark-card"
                key={bookmark.id}
              >

                {/* BOOK ICON */}

                <div className="bookmark-book-icon">
                  <BookOpen size={25} />
                </div>


                {/* CONTENT */}

                <div className="bookmark-card-content">

                  <div className="bookmark-meta">

                    <span className="bookmark-book-name">
                      {bookmark.book ||
                        "Saved Book"}
                    </span>

                    <span>
                      {bookmark.chapter ||
                        `Chapter ${
                          bookmark.chapterId || 1
                        }`}
                    </span>

                  </div>


                  <h3>
                    Page {bookmark.page || 1}
                  </h3>


                  <p className="bookmark-quote">
                    “
                    {bookmark.text ||
                      "Saved passage"}
                    ”
                  </p>


                  <div className="bookmark-bottom">

                    <div className="bookmark-time">

                      <Clock3 size={14} />

                      <span>
                        {bookmark.time ||
                          "Saved recently"}
                      </span>

                    </div>


                    <Link
                      to={`/book/${bookmark.bookId || 1}/read/${bookmark.chapterId || 1}`}
                      className="bookmark-read-button"
                    >

                      <Play size={14} />

                      Continue Reading

                      <ArrowRight size={14} />

                    </Link>

                  </div>

                </div>


                {/* DELETE */}

                <button
                  type="button"
                  className="bookmark-delete-button"
                  aria-label="Remove bookmark"
                  title="Remove bookmark"
                  onClick={() =>
                    deleteBookmark(bookmark.id)
                  }
                >
                  <Trash2 size={17} />
                </button>

              </article>

            ))}

          </div>

        ) : (

          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="bookmarks-empty">

            <div className="empty-bookmark-icon">
              <Bookmark size={30} />
            </div>

            <h2>
              {search ||
              selectedBook !== "All Books"
                ? "No bookmarks found"
                : "No bookmarks yet"}
            </h2>

            <p>
              {search ||
              selectedBook !== "All Books"
                ? "Try another search or choose a different book."
                : "Save important pages while reading and they will appear here."}
            </p>

            {search ||
            selectedBook !== "All Books" ? (

              <button
                type="button"
                className="empty-reset-button"
                onClick={() => {
                  setSearch("");
                  setSelectedBook("All Books");
                }}
              >
                Clear Filters
              </button>

            ) : (

              <Link
                to="/books"
                className="empty-start-button"
              >
                Start Reading
                <ArrowRight size={16} />
              </Link>

            )}

          </div>

        )}

      </section>


      {/* =====================================================
          READING TIP
      ===================================================== */}

      <section className="bookmark-tip">

        <div className="bookmark-tip-icon">
          <Bookmark size={23} />
        </div>

        <div>

          <span>
            READING TIP
          </span>

          <h2>
            Save the moments you want to remember.
          </h2>

          <p>
            While reading, use the bookmark button
            to save an important page or passage.
            Your saved moments will stay available here.
          </p>

        </div>

        <Link
          to="/books"
          className="bookmark-tip-button"
        >
          Start Reading
          <ArrowRight size={16} />
        </Link>

      </section>

    </main>
  );
}

export default Bookmarks;