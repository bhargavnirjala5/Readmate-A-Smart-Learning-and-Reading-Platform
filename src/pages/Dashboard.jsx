import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Bookmark,
  FileText,
  Headphones,
  Mic,
  Languages,
  Upload,
  Camera,
  Clock3,
  Flame,
  Target,
  ArrowRight,
  Play,
  TrendingUp,
} from "lucide-react";

const books = [
  {
    id: 1,
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    color: "book-card-gold",
  },
  {
    id: 2,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    color: "book-card-blue",
  },
  {
    id: 3,
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    color: "book-card-purple",
  },
];

function Dashboard() {
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [progressData, setProgressData] = useState({});

  const loadSavedData = () => {
    try {
      let bookmarkTotal = 0;

      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key?.startsWith("readly_bookmarks_")) bookmarkTotal += 1;
      }

      const legacyBookmarks = JSON.parse(
        localStorage.getItem("readly_bookmarks") || "[]"
      );

      if (bookmarkTotal === 0 && Array.isArray(legacyBookmarks)) {
        bookmarkTotal = legacyBookmarks.length;
      }

      const notes = JSON.parse(localStorage.getItem("readly_notes") || "[]");
      const savedProgress = JSON.parse(
        localStorage.getItem("readly_reading_progress") || "{}"
      );

      setBookmarkCount(bookmarkTotal);
      setNoteCount(Array.isArray(notes) ? notes.length : 0);
      setProgressData(
        savedProgress && typeof savedProgress === "object"
          ? savedProgress
          : {}
      );
    } catch (error) {
      console.error("Error loading saved data:", error);
      setBookmarkCount(0);
      setNoteCount(0);
      setProgressData({});
    }
  };

  useEffect(() => {
    loadSavedData();

    const handleStorageChange = () => loadSavedData();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadSavedData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("readly-data-updated", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("readly-data-updated", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const dashboardBooks = books.map((book) => ({
    ...book,
    progress: Math.max(
      0,
      Math.min(100, Number(progressData[book.id]?.progress) || 0)
    ),
    chapterId: progressData[book.id]?.chapterId || "1",
    pageIndex: Math.max(0, Number(progressData[book.id]?.pageIndex) || 0),
    lastRead: Number(progressData[book.id]?.lastRead ?? progressData[book.id]?.updatedAt) || 0,
  }));

  const startedBooks = dashboardBooks.filter((book) => book.progress > 0).length;

  const overallProgress = dashboardBooks.length
    ? Math.round(
        dashboardBooks.reduce((sum, book) => sum + book.progress, 0) /
          dashboardBooks.length
      )
    : 0;

  const recentBook = [...dashboardBooks]
    .filter((book) => book.lastRead > 0)
    .sort((a, b) => b.lastRead - a.lastRead)[0];

  const orderedDashboardBooks = recentBook
    ? [
        recentBook,
        ...dashboardBooks.filter((book) => book.id !== recentBook.id),
      ]
    : dashboardBooks;

  const formatReadingTime = () => {
    const seconds = Number(localStorage.getItem("readly_reading_seconds") || 0);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) return `${hours}h ${remainingMinutes}m`;
    return `${remainingMinutes}m`;
  };

  const readingSeconds = Number(
    localStorage.getItem("readly_reading_seconds") || 0
  );
  const readingMinutes = Math.floor(readingSeconds / 60);
  const dailyGoalPercent = Math.min(100, Math.round((readingMinutes / 30) * 100));

  const readingDates = JSON.parse(
    localStorage.getItem("readly_reading_dates") || "[]"
  );

  let streak = Array.isArray(readingDates) ? readingDates.length : 0;

  if (streak === 0) {
    try {
      const activity = JSON.parse(
        localStorage.getItem("readly_reading_activity") || "{}"
      );
      streak = activity.lastReadDate ? 1 : 0;
    } catch {
      streak = 0;
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-badge">
          <TrendingUp size={15} />
          YOUR READING SPACE
        </div>

        <h1>Reading Dashboard</h1>

        <p>
          Track your reading journey, continue your books,
          and manage your smart reading tools in one place.
        </p>
      </section>

      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <BookOpen size={21} />
          </div>
          <strong>{books.length}</strong>
          <span>Total Books</span>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Play size={21} />
          </div>
          <strong>{startedBooks}</strong>
          <span>Books Started</span>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Bookmark size={21} />
          </div>
          <strong>{bookmarkCount}</strong>
          <span>Bookmarks</span>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <FileText size={21} />
          </div>
          <strong>{noteCount}</strong>
          <span>Notes</span>
        </div>
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-panel continue-panel">
          <div className="panel-heading">
            <div>
              <span>CONTINUE READING</span>
              <h2>Pick up where you left off</h2>
            </div>

            <Link to="/books">
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="dashboard-books">
            {orderedDashboardBooks.map((book) => (
              <Link
                to={`/book/${book.id}/read/${book.chapterId}?page=${book.pageIndex + 1}`}
                className="dashboard-book-card"
                key={book.id}
              >
                <div className={`dashboard-book-cover ${book.color}`}>
                  <BookOpen size={30} />
                </div>

                <div className="dashboard-book-info">
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>

                  <div className="dashboard-progress-row">
                    <span>{book.progress}% completed</span>
                  </div>

                  <div className="dashboard-progress">
                    <span style={{ width: `${book.progress}%` }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="dashboard-panel tools-panel">
          <div className="panel-heading">
            <div>
              <span>READING TOOLS</span>
              <h2>Smart features</h2>
            </div>
          </div>

          <div className="dashboard-tools">
            <Link to="/book/1/read/1" className="dashboard-tool">
              <div className="tool-icon">
                <Headphones size={19} />
              </div>
              <div>
                <strong>Listen</strong>
                <span>Male & Female voices</span>
              </div>
              <ArrowRight size={15} />
            </Link>

            <Link to="/book/1/read/1" className="dashboard-tool">
              <div className="tool-icon">
                <Mic size={19} />
              </div>
              <div>
                <strong>Read Aloud</strong>
                <span>Practice pronunciation</span>
              </div>
              <ArrowRight size={15} />
            </Link>

            <Link to="/book/1/read/1" className="dashboard-tool">
              <div className="tool-icon">
                <Languages size={19} />
              </div>
              <div>
                <strong>Translation</strong>
                <span>Understand difficult words</span>
              </div>
              <ArrowRight size={15} />
            </Link>

            <Link to="/bookmarks" className="dashboard-tool">
              <div className="tool-icon">
                <Bookmark size={19} />
              </div>
              <div>
                <strong>Bookmarks</strong>
                <span>{bookmarkCount} saved pages and passages</span>
              </div>
              <ArrowRight size={15} />
            </Link>

            <Link to="/notes" className="dashboard-tool">
              <div className="tool-icon">
                <FileText size={19} />
              </div>
              <div>
                <strong>Notes</strong>
                <span>{noteCount} saved reading notes</span>
              </div>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section className="dashboard-activity-grid">
        <div className="dashboard-panel activity-panel">
          <div className="panel-heading">
            <div>
              <span>READING ACTIVITY</span>
              <h2>Your progress</h2>
            </div>
          </div>

          <div className="activity-content">
            <div
              className="activity-circle"
              style={{
                background: `conic-gradient(#b97936 ${overallProgress * 3.6}deg, #eadfce 0deg)`,
              }}
            >
              <div>
                <strong>{overallProgress}%</strong>
                <span>Overall</span>
              </div>
            </div>

            <div className="activity-details">
              <div className="activity-item">
                <Clock3 size={18} />
                <div>
                  <strong>Reading Time</strong>
                  <span>{formatReadingTime()}</span>
                </div>
              </div>

              <div className="activity-item">
                <Flame size={18} />
                <div>
                  <strong>Reading Streak</strong>
                  <span>{streak} {streak === 1 ? "day" : "days"}</span>
                </div>
              </div>

              <div className="activity-item">
                <Target size={18} />
                <div>
                  <strong>Daily Goal</strong>
                  <span>{dailyGoalPercent}% completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel quick-panel">
          <div className="panel-heading">
            <div>
              <span>QUICK ACTIONS</span>
              <h2>Add something new</h2>
            </div>
          </div>

          <div className="quick-actions">
            <Link to="/upload" className="quick-action">
              <div className="quick-icon">
                <Upload size={21} />
              </div>
              <div>
                <strong>Upload a Book</strong>
                <span>Open your PDF</span>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link to="/scan" className="quick-action">
              <div className="quick-icon">
                <Camera size={21} />
              </div>
              <div>
                <strong>Scan a Page</strong>
                <span>Use camera OCR</span>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link to="/books" className="quick-action">
              <div className="quick-icon">
                <BookOpen size={21} />
              </div>
              <div>
                <strong>Explore Books</strong>
                <span>Choose your next book</span>
              </div>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="dashboard-bottom-card">
        <div className="bottom-card-icon">
          <BookOpen size={28} />
        </div>

        <div>
          <span>KEEP READING</span>
          <h2>Every page takes you somewhere new.</h2>
          <p>
            {recentBook
              ? `Continue ${recentBook.title} from Chapter ${recentBook.chapterId}.`
              : "Continue your reading journey and explore all the smart features available to you."}
          </p>
        </div>

        <Link to="/books" className="bottom-card-button">
          Explore Books
          <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}

export default Dashboard;