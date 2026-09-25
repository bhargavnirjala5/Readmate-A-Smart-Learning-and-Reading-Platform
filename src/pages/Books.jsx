import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import "../App.css";

const books = [
  {
    id: "1",
    number: "01",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    category: "Classic",
    description:
      "A classic story of love, independence, courage, and the journey of Jane Eyre as she discovers her place in the world.",
  },
  {
    id: "2",
    number: "02",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Classic",
    description:
      "A classic story of love, relationships, family, and the importance of understanding others.",
  },
  {
    id: "3",
    number: "03",
    title: "Alice in Wonderland",
    author: "Lewis Carroll",
    category: "Classic",
    description:
      "Follow Alice into a magical world filled with strange characters, exciting adventures, and imagination.",
  },
];

function Books() {
  const [search, setSearch] = useState("");

  const filteredBooks = books.filter((book) =>
    `${book.title} ${book.author}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="final-books-page">

      {/* HEADER */}
      <section className="final-books-header">

        <div className="books-header-badge">
          <Sparkles size={14} />
          SMART READING LIBRARY
        </div>

        <h1>
          Choose your next
          <span> book.</span>
        </h1>

        <p>
          Explore your reading collection and choose a book
          to begin your smart reading journey.
        </p>

        <div className="books-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search books or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      </section>

      {/* BOOK GRID */}
      <section className="final-books-grid">

        {filteredBooks.map((book) => (

          <article
            className="final-book-card"
            key={book.id}
          >

            {/* COVER */}
            <div className={`final-library-cover cover-${book.id}`}>

              <div className="library-cover-top">
                <span>{book.category}</span>
                <span>{book.number}</span>
              </div>

              <div className="library-cover-center">

                <BookOpen
                  size={40}
                  strokeWidth={1.3}
                />

                <h2>{book.title}</h2>

                <div className="library-cover-line"></div>

                <p>{book.author}</p>

              </div>

              <div className="library-cover-bottom">
                READLY
              </div>

            </div>

            {/* INFORMATION */}
            <div className="final-book-card-content">

              <div className="book-card-category">
                {book.category}
              </div>

              <h2>{book.title}</h2>

              <h3>{book.author}</h3>

              <p>{book.description}</p>

              <div className="book-card-footer">

                <span className="book-progress">
                  <span></span>
                  0% read
                </span>

                <Link
                  to={`/book/${book.id}`}
                  className="book-open-button"
                >
                  Open Book
                  <ArrowRight size={16} />
                </Link>

              </div>

            </div>

          </article>

        ))}

      </section>

      {/* EMPTY SEARCH */}
      {filteredBooks.length === 0 && (

        <div className="books-empty">

          <BookOpen size={35} />

          <h2>No books found</h2>

          <p>
            Try searching with another book title or author.
          </p>

        </div>

      )}

      {/* BOTTOM INFO */}
      <section className="library-bottom-card">

        <div className="library-bottom-icon">
          <Bookmark size={21} />
        </div>

        <div>

          <span>YOUR READING SPACE</span>

          <h2>
            Read. Listen. Learn.
          </h2>

          <p>
            Choose a book and enjoy an interactive reading
            experience with voice reading, highlighting,
            notes, bookmarks and translation.
          </p>

        </div>

      </section>

    </main>
  );
}

export default Books;