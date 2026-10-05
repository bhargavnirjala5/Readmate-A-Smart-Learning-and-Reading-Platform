import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Headphones,
  Languages,
  Mic,
  Play,
  Sparkles,
  Check,
} from "lucide-react";
import { useState } from "react";
import "../App.css";

const books = {
  "1": {
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    category: "Classic",
    number: "01",
    description:
      "A powerful story of independence, courage, love, and Jane Eyre's journey to find her place in the world.",
    about:
      "Jane Eyre follows the life of a young woman who grows through difficult experiences while searching for independence, love, dignity, and a meaningful life.",
    chapters: 38,
  },

  "2": {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Classic",
    number: "02",
    description:
      "A classic story of love, relationships, family, and the importance of understanding others.",
    about:
      "Pride and Prejudice explores relationships, misunderstandings, family, personality, and the importance of looking beyond first impressions.",
    chapters: 61,
  },

  "3": {
    title: "Alice in Wonderland",
    author: "Lewis Carroll",
    category: "Classic",
    number: "03",
    description:
      "Follow Alice into a magical world filled with strange characters, exciting adventures, and imagination.",
    about:
      "Alice in Wonderland takes readers into a wonderfully strange world where imagination, curiosity, and unexpected adventures are around every corner.",
    chapters: 12,
  },
};

function BookInfo() {
  const { bookId } = useParams();

  const book = books[bookId] || books["1"];

  const [saved, setSaved] = useState(() => {
    return (
      localStorage.getItem(
        `saved-book-${bookId}`
      ) === "true"
    );
  });

  const handleSave = () => {
    const newValue = !saved;

    setSaved(newValue);

    if (newValue) {
      localStorage.setItem(
        `saved-book-${bookId}`,
        "true"
      );
    } else {
      localStorage.removeItem(
        `saved-book-${bookId}`
      );
    }
  };

  return (
    <main className="final-book-info-page">

      {/* TOP BAR */}

      <div className="final-book-topbar">

        <Link
          to="/books"
          className="final-back-link"
        >
          <ArrowLeft size={17} />
          Back to Library
        </Link>

        <button
          type="button"
          className={`final-bookmark-button ${
            saved ? "saved" : ""
          }`}
          onClick={handleSave}
          title={
            saved
              ? "Remove bookmark"
              : "Save book"
          }
        >
          {saved ? (
            <Check size={18} />
          ) : (
            <Bookmark size={18} />
          )}
        </button>

      </div>

      {/* MAIN HERO */}

      <section className="final-book-hero">

        {/* BOOK COVER */}

        <div className="final-cover-area">

          <div className="final-book-shadow"></div>

          <div
            className={`final-book-cover cover-${bookId}`}
          >

            <div className="cover-top">
              <span>
                {book.category}
              </span>

              <span>
                {book.number}
              </span>
            </div>

            <div className="cover-center">

              <BookOpen
                size={46}
                strokeWidth={1.3}
              />

              <h2>
                {book.title}
              </h2>

              <div className="cover-divider"></div>

              <p>
                {book.author}
              </p>

            </div>

            <div className="cover-bottom">
              READLY • SMART READING
            </div>

          </div>

        </div>

        {/* BOOK DETAILS */}

        <div className="final-book-details">

          <div className="final-small-badge">
            <Sparkles size={14} />
            SMART READING EXPERIENCE
          </div>

          <div className="final-category">
            {book.category}
          </div>

          <h1>
            {book.title}
          </h1>

          <h3>
            by {book.author}
          </h3>

          <p className="final-description">
            {book.description}
          </p>

          {/* ACTIONS */}

          <div className="final-actions">

            <Link
              to={`/book/${bookId}/index`}
              className="final-start-button"
            >
              <BookOpen size={18} />
              Start Reading
              <ArrowRight size={17} />
            </Link>

            <button
              type="button"
              onClick={handleSave}
              className={`final-save-button ${
                saved ? "saved" : ""
              }`}
            >
              {saved ? (
                <Check size={18} />
              ) : (
                <Bookmark size={18} />
              )}

              {saved
                ? "Saved"
                : "Save Book"}
            </button>

          </div>

          {/* QUICK STATS */}

          <div className="final-stats">

            <div className="final-stat">

              <div className="final-stat-icon">
                <BookOpen size={18} />
              </div>

              <div>
                <strong>
                  {book.chapters}
                </strong>

                <span>
                  Chapters
                </span>
              </div>

            </div>

            <div className="final-stat">

              <div className="final-stat-icon">
                <Headphones size={18} />
              </div>

              <div>
                <strong>2</strong>

                <span>
                  Voices
                </span>
              </div>

            </div>

            <div className="final-stat">

              <div className="final-stat-icon">
                <Languages size={18} />
              </div>

              <div>
                <strong>AI</strong>

                <span>
                  Translation
                </span>
              </div>

            </div>

            <div className="final-stat">

              <div className="final-stat-icon">
                <Mic size={18} />
              </div>

              <div>
                <strong>Live</strong>

                <span>
                  Read Aloud
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* READING PROGRESS */}

      <section className="final-progress-card">

        <div className="progress-left">

          <div className="progress-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <span>
              Your Reading Progress
            </span>

            <strong>
              Ready to begin
            </strong>
          </div>

        </div>

        <div className="progress-right">

          <div className="progress-bar">
            <span
              style={{
                width: "0%",
              }}
            ></span>
          </div>

          <strong>
            0%
          </strong>

        </div>

      </section>

      {/* ABOUT */}

      <section className="final-about">

        <div className="final-section-label">
          ABOUT THIS BOOK
        </div>

        <div className="final-about-grid">

          <div>
            <h2>
              A smarter way
              <br />
              to read.
            </h2>
          </div>

          <div>
            <p>
              {book.about}
            </p>
          </div>

        </div>

      </section>

      {/* SMART READING FEATURES */}

      <section className="final-features">

        <div className="final-section-heading">

          <div>

            <span>
              BUILT FOR BETTER READING
            </span>

            <h2>
              Everything you need to read smarter.
            </h2>

          </div>

        </div>

        <div className="final-feature-grid">

          <div className="final-feature-card">

            <div className="final-feature-icon">
              <Headphones size={21} />
            </div>

            <div>

              <h3>
                Listen while reading
              </h3>

              <p>
                Choose between male and female voices
                and listen while following the text.
              </p>

            </div>

          </div>

          <div className="final-feature-card">

            <div className="final-feature-icon">
              <Play size={21} />
            </div>

            <div>

              <h3>
                Sentence highlighting
              </h3>

              <p>
                The sentence currently being spoken
                will be highlighted automatically.
              </p>

            </div>

          </div>

          <div className="final-feature-card">

            <div className="final-feature-icon">
              <Mic size={21} />
            </div>

            <div>

              <h3>
                Read aloud practice
              </h3>

              <p>
                Read the text yourself and practice
                pronunciation with voice feedback.
              </p>

            </div>

          </div>

          <div className="final-feature-card">

            <div className="final-feature-icon">
              <Languages size={21} />
            </div>

            <div>

              <h3>
                Instant translation
              </h3>

              <p>
                Understand difficult words and
                sentences while reading.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* START READING CTA */}

      <section className="final-start-card">

        <div className="final-start-content">

          <div className="final-start-icon">
            <BookOpen size={23} />
          </div>

          <div>

            <span>
              READY TO BEGIN?
            </span>

            <h2>
              Your reading journey starts here.
            </h2>

            <p>
              Open the book index, choose a chapter,
              and start your smart reading experience.
            </p>

          </div>

        </div>

        <Link
          to={`/book/${bookId}/index`}
          className="final-start-card-button"
        >
          Open Book Index
          <ArrowRight size={18} />
        </Link>

      </section>

    </main>
  );
}

export default BookInfo;