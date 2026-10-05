import { Link } from "react-router-dom";
import {
  BookOpen,
  Upload,
  Camera,
  Headphones,
  Mic,
  Languages,
  Bookmark,
  ArrowRight,
  Sparkles,
  Play,
  FileText,
} from "lucide-react";

function Home() {
  return (
    <main className="home-page">

      {/* ================= HERO ================= */}
      <section className="home-hero">

        {/* LEFT SIDE */}
        <div className="hero-left">

          <div className="hero-badge">
            <Sparkles size={14} />
            SMART READING EXPERIENCE
          </div>

          <h1>
            Read books.
            <br />
            <span>Listen.</span>
            <br />
            <span>Learn.</span>
          </h1>

          <p>
            Your personal digital reading space to read books, upload PDFs,
            scan pages, listen with natural voices, practice pronunciation,
            translate difficult words, and continue your reading journey.
          </p>

          {/* MAIN BUTTONS */}
          <div className="home-buttons">

            <Link to="/books" className="primary-button">
              <BookOpen size={17} />
              Start Reading
              <ArrowRight size={16} />
            </Link>

            <Link to="/upload" className="secondary-button">
              <Upload size={17} />
              Upload a Book
            </Link>

          </div>

          {/* EXTRA BUTTON */}
          <Link to="/scan" className="scan-home-button">
            <Camera size={15} />
            Scan a Book Page
          </Link>

          {/* FEATURES */}
          <div className="home-mini-features">

            <div>
              <Headphones size={15} />
              Male & Female Voice
            </div>

            <div>
              <Mic size={15} />
              Read Aloud
            </div>

            <div>
              <Languages size={15} />
              Translation
            </div>

            <div>
              <Bookmark size={15} />
              Bookmarks & Notes
            </div>

          </div>

        </div>


        {/* ================= RIGHT SIDE ================= */}
        <div className="reading-visual">

          <div className="visual-glow"></div>

          {/* BOOK */}
          <div className="open-book">

            <div className="book-page left-page">

              <small>CHAPTER ONE</small>

              <h3>
                The Art of
                <br />
                Reading
              </h3>

              <div className="fake-lines">
                <span></span>
                <span></span>
                <span className="short"></span>
                <span></span>
                <span></span>
              </div>

              <span className="page-number">01</span>

            </div>


            <div className="book-page right-page">

              <span className="page-number">02</span>

              <p>
                Reading opens a door to new worlds.
                Every page brings a new idea,
                a new story, and a new way of
                seeing things.
              </p>

              <p className="highlighted-line">
                The journey begins with one page.
              </p>

              <div className="fake-lines">
                <span></span>
                <span></span>
                <span className="short"></span>
              </div>

            </div>

          </div>


          {/* ================= LISTENING CARD ================= */}
          <div className="floating-reading-card voice-card">

            <div className="small-icon">
              <Headphones size={17} />
            </div>

            <div>
              <strong>Now Listening</strong>
              <span>Female Voice</span>
            </div>

            <div className="wave">
              <i></i>
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </div>

          </div>


          {/* ================= UPLOAD CARD ================= */}
          <Link to="/upload" className="floating-feature-card upload-card">

            <div className="feature-card-icon">
              <Upload size={18} />
            </div>

            <div>
              <strong>Upload PDF</strong>
              <span>Read your own book</span>
            </div>

          </Link>


          {/* ================= SCAN CARD ================= */}
          <Link to="/scan" className="floating-feature-card scan-card">

            <div className="feature-card-icon">
              <Camera size={18} />
            </div>

            <div>
              <strong>Scan Page</strong>
              <span>Convert image to text</span>
            </div>

          </Link>


          {/* ================= PROGRESS CARD ================= */}
          <div className="floating-reading-card progress-card">

            <div className="progress-circle">
              <span>24%</span>
            </div>

            <div>
              <strong>Reading Progress</strong>
              <span>Keep going</span>
            </div>

          </div>

        </div>

      </section>


      {/* ================= BOTTOM FEATURE STRIP ================= */}
      <section className="home-feature-strip">

        <div className="feature-strip-card">

          <div className="strip-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <strong>3 Featured Books</strong>
            <span>Start with our reading collection</span>
          </div>

        </div>


        <div className="feature-strip-card">

          <div className="strip-icon">
            <FileText size={20} />
          </div>

          <div>
            <strong>Upload PDF</strong>
            <span>Bring your own books</span>
          </div>

        </div>


        <div className="feature-strip-card">

          <div className="strip-icon">
            <Camera size={20} />
          </div>

          <div>
            <strong>Camera Scan</strong>
            <span>Scan printed pages with OCR</span>
          </div>

        </div>


        <div className="feature-strip-card">

          <div className="strip-icon">
            <Play size={20} />
          </div>

          <div>
            <strong>Listen & Read</strong>
            <span>Follow along with highlighting</span>
          </div>

        </div>

      </section>

    </main>
  );
}

export default Home;