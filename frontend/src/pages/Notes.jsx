import { Link } from "react-router-dom";
import {
  FileText,
  BookOpen,
  Plus,
  Search,
  Clock3,
  ArrowRight,
  Edit3,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "../App.css";

const NOTES_KEY = "readly_notes";

const BOOKS = {
  1: "The Little Prince",
  2: "Pride and Prejudice",
  3: "Alice in Wonderland",
};

function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // ================= LOAD NOTES =================

  useEffect(() => {
    loadNotes();

    const handleDataUpdate = () => {
      loadNotes();
    };

    window.addEventListener("readly-data-updated", handleDataUpdate);

    window.addEventListener("storage", handleDataUpdate);

    return () => {
      window.removeEventListener(
        "readly-data-updated",
        handleDataUpdate
      );

      window.removeEventListener(
        "storage",
        handleDataUpdate
      );
    };
  }, []);

  const loadNotes = () => {
    try {
      const storedNotes = JSON.parse(
        localStorage.getItem(NOTES_KEY) || "[]"
      );

      const formattedNotes = storedNotes.map((note) => ({
        ...note,

        id: note.id || Date.now(),

        bookId: note.bookId || 1,

        chapterId: note.chapterId || 1,

        book:
          note.book ||
          BOOKS[note.bookId] ||
          "Unknown Book",

        chapter:
          note.chapter ||
          `Chapter ${note.chapterId || 1}`,

        title:
          note.title ||
          "My Reading Note",

        // Support old and new note formats
        text:
          note.text ||
          note.content ||
          note.note ||
          note.body ||
          "",

        time:
          note.time ||
          "Saved note",
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error("Unable to load notes:", error);
      setNotes([]);
    }
  };

  // ================= SEARCH =================

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return notes;
    }

    return notes.filter((note) =>
      `${note.book} ${note.chapter} ${note.title} ${note.text}`
        .toLowerCase()
        .includes(query)
    );
  }, [notes, search]);

  // ================= DELETE =================

  const deleteNote = (note) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    const updatedNotes = notes.filter(
      (item) => item.id !== note.id
    );

    localStorage.setItem(
      NOTES_KEY,
      JSON.stringify(updatedNotes)
    );

    setNotes(updatedNotes);

    window.dispatchEvent(
      new Event("readly-data-updated")
    );
  };

  // ================= EDIT =================

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditText(note.text || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEditedNote = (note) => {
    const cleanText = editText.trim();

    if (!cleanText) {
      alert("Please write something in the note.");
      return;
    }

    const storedNotes = JSON.parse(
      localStorage.getItem(NOTES_KEY) || "[]"
    );

    const updatedStoredNotes = storedNotes.map((item) => {
      if (item.id === note.id) {
        return {
          ...item,
          text: cleanText,
          time: "Just now",
        };
      }

      return item;
    });

    localStorage.setItem(
      NOTES_KEY,
      JSON.stringify(updatedStoredNotes)
    );

    setNotes(
      updatedStoredNotes.map((item) => ({
        ...item,

        book:
          item.book ||
          BOOKS[item.bookId] ||
          "Unknown Book",

        chapter:
          item.chapter ||
          `Chapter ${item.chapterId || 1}`,

        title:
          item.title ||
          "My Reading Note",

        text:
          item.text ||
          item.content ||
          item.note ||
          item.body ||
          "",

        time:
          item.time ||
          "Saved note",
      }))
    );

    setEditingId(null);
    setEditText("");

    window.dispatchEvent(
      new Event("readly-data-updated")
    );
  };

  return (
    <main className="notes-page">

      {/* ================= HERO ================= */}

      <section className="notes-hero">

        <div className="notes-badge">
          <Sparkles size={15} />
          YOUR READING NOTES
        </div>

        <h1>Notes</h1>

        <p>
          Keep your thoughts, important ideas, and
          learning points together while you read.
        </p>

      </section>


      {/* ================= TOOLBAR ================= */}

      <section className="notes-toolbar">

        <div className="notes-count">

          <div className="notes-count-icon">
            <FileText size={20} />
          </div>

          <div>
            <strong>{notes.length}</strong>

            <span>
              Saved Notes
            </span>
          </div>

        </div>


        <div className="notes-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search your notes..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="notes-clear-search"
            >
              <X size={15} />
            </button>
          )}

        </div>


        <Link
          to="/book/1/read/1"
          className="add-note-button"
        >
          <Plus size={17} />
          New Note
        </Link>

      </section>


      {/* ================= NOTES CONTENT ================= */}

      <section className="notes-content">

        <div className="notes-heading">

          <div>

            <span>
              SAVED THOUGHTS
            </span>

            <h2>
              Your notes
            </h2>

          </div>

          <Link
            to="/books"
            className="notes-continue-link"
          >
            Continue Reading
            <ArrowRight size={16} />
          </Link>

        </div>


        {/* ================= NOTES GRID ================= */}

        {filteredNotes.length > 0 ? (

          <div className="notes-grid">

            {filteredNotes.map((note) => (

              <article
                className="note-card"
                key={note.id}
              >

                {/* HEADER */}

                <div className="note-card-header">

                  <div className="note-icon">
                    <FileText size={20} />
                  </div>

                  <div className="note-actions">

                    <button
                      type="button"
                      aria-label="Edit note"
                      className="note-action-button"
                      onClick={() =>
                        startEditing(note)
                      }
                    >
                      <Edit3 size={15} />
                    </button>


                    <button
                      type="button"
                      aria-label="Delete note"
                      className="note-action-button delete-note"
                      onClick={() =>
                        deleteNote(note)
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                </div>


                {/* CONTENT */}

                <div className="note-card-content">

                  <div className="note-book-info">

                    <BookOpen size={14} />

                    <span>
                      {note.book}
                    </span>

                  </div>


                  <span className="note-chapter">
                    {note.chapter}
                  </span>


                  <h3>
                    {note.title}
                  </h3>


                  {editingId === note.id ? (

                    <div className="note-edit-box">

                      <textarea
                        value={editText}
                        onChange={(event) =>
                          setEditText(
                            event.target.value
                          )
                        }
                        autoFocus
                      />

                      <div className="note-edit-buttons">

                        <button
                          type="button"
                          onClick={() =>
                            saveEditedNote(note)
                          }
                          className="note-save-button"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="note-cancel-button"
                        >
                          Cancel
                        </button>

                      </div>

                    </div>

                  ) : (

                    <p
                      style={{
                        display: "block",
                        overflow: "visible",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: "none",
                        WebkitLineClamp: "unset",
                      }}
                    >
                      {note.text || "No note content available."}
                    </p>

                  )}

                </div>


                {/* FOOTER */}

                <div className="note-card-footer">

                  <div className="note-time">

                    <Clock3 size={13} />

                    {note.time}

                  </div>


                  <Link
                    to={`/book/${note.bookId}/read/${note.chapterId}`}
                    className="open-note-button"
                  >
                    Open
                    <ArrowRight size={14} />
                  </Link>

                </div>

              </article>

            ))}

          </div>

        ) : (

          /* ================= EMPTY STATE ================= */

          <div className="notes-empty">

            <div className="notes-empty-icon">
              <FileText size={30} />
            </div>

            <h2>
              {search
                ? "No notes found"
                : "No notes yet"}
            </h2>

            <p>
              {search
                ? "Try searching with another word or phrase."
                : "Start reading and add your thoughts, ideas, and important points."}
            </p>


            {search ? (

              <button
                type="button"
                className="notes-reset-button"
                onClick={() => setSearch("")}
              >
                Clear Search
              </button>

            ) : (

              <Link
                to="/book/1/read/1"
                className="notes-start-button"
              >
                Start Reading
                <ArrowRight size={16} />
              </Link>

            )}

          </div>

        )}

      </section>


      {/* ================= CREATE NOTE CARD ================= */}

      <section className="create-note-card">

        <div className="create-note-icon">
          <Plus size={25} />
        </div>

        <div>

          <span>
            MAKE READING PERSONAL
          </span>

          <h2>
            Create a note while you read.
          </h2>

          <p>
            Write down ideas, difficult concepts,
            interesting sentences, or anything you
            want to remember.
          </p>

        </div>

        <Link
          to="/book/1/read/1"
          className="create-note-button"
        >
          Start Reading
          <ArrowRight size={16} />
        </Link>

      </section>


      {/* ================= NOTE FEATURES ================= */}

      <section className="notes-features">

        <div className="notes-feature">

          <FileText size={20} />

          <div>

            <strong>
              Quick Notes
            </strong>

            <span>
              Capture thoughts without leaving
              the reader.
            </span>

          </div>

        </div>


        <div className="notes-feature">

          <BookOpen size={20} />

          <div>

            <strong>
              Book Based
            </strong>

            <span>
              Keep notes connected to their books
              and chapters.
            </span>

          </div>

        </div>


        <div className="notes-feature">

          <Edit3 size={20} />

          <div>

            <strong>
              Edit Anytime
            </strong>

            <span>
              Update your notes whenever you want.
            </span>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Notes;