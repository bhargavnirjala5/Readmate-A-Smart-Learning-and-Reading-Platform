import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Bookmark,
  FileText,
  Languages,
  Mic,
  Play,
  Pause,
  Square,
  Headphones,
} from "lucide-react";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PdfReader() {
  const navigate = useNavigate();
  const location = useLocation();

  const fileUrl = location.state?.fileUrl;
  const fileName = location.state?.fileName || "Uploaded Book";

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const [zoom, setZoom] = useState(1);

  const [pageText, setPageText] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  const [voiceType, setVoiceType] = useState("female");

  const [bookmarked, setBookmarked] = useState(false);

  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    if (!fileUrl) {
      navigate("/upload", { replace: true });
    }
  }, [fileUrl, navigate]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!fileUrl) {
    return null;
  }

  /* ================= PDF LOAD ================= */

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  /* ================= PAGE TEXT ================= */

  const handleTextLayerSuccess = (items) => {
    if (!items || !items.items) return;

    const text = items.items
      .map((item) => item.str)
      .join(" ")
      .trim();

    setPageText(text);
  };

  /* ================= PAGE NAVIGATION ================= */

  const previousPage = () => {
    stopSpeaking();

    setPageNumber((current) => Math.max(current - 1, 1));
  };

  const nextPage = () => {
    stopSpeaking();

    setPageNumber((current) =>
      Math.min(current + 1, numPages || 1)
    );
  };

  /* ================= ZOOM ================= */

  const increaseZoom = () => {
    setZoom((current) => Math.min(current + 0.1, 1.8));
  };

  const decreaseZoom = () => {
    setZoom((current) => Math.max(current - 0.1, 0.6));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  /* ================= READ ALOUD ================= */

  const startSpeaking = () => {
    if (!pageText) {
      alert("No readable text found on this page.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(pageText);

    utterance.rate = 0.9;
    utterance.pitch = voiceType === "female" ? 1.1 : 0.8;

    const voices = window.speechSynthesis.getVoices();

    const englishVoices = voices.filter(
      (voice) =>
        voice.lang &&
        voice.lang.toLowerCase().startsWith("en")
    );

    if (englishVoices.length > 0) {
      if (voiceType === "female") {
        const femaleVoice =
          englishVoices.find((voice) =>
            /female|samantha|zira|karen|susan/i.test(
              voice.name
            )
          );

        utterance.voice =
          femaleVoice || englishVoices[0];
      } else {
        const maleVoice =
          englishVoices.find((voice) =>
            /male|david|mark|daniel|george/i.test(
              voice.name
            )
          );

        utterance.voice =
          maleVoice || englishVoices[0];
      }
    }

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeaking = () => {
    window.speechSynthesis.pause();
    setPaused(true);
  };

  const resumeSpeaking = () => {
    window.speechSynthesis.resume();
    setPaused(false);
  };

  function stopSpeaking() {
    window.speechSynthesis.cancel();

    setSpeaking(false);
    setPaused(false);
  }

  /* ================= BOOKMARK ================= */

  const toggleBookmark = () => {
    setBookmarked((current) => !current);
  };

  /* ================= DOWNLOAD ================= */

  const downloadPdf = () => {
    const link = document.createElement("a");

    link.href = fileUrl;
    link.download = fileName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  /* ================= TRANSLATION ================= */

  const translateText = () => {
    setShowTranslation((current) => !current);
  };

  return (
    <main className="smart-pdf-reader">

      {/* ================= HEADER ================= */}

      <header className="smart-pdf-header">

        <button
          className="smart-pdf-back"
          onClick={() => navigate("/upload")}
        >
          <ArrowLeft size={18} />
          Upload
        </button>

        <div className="smart-pdf-title">

          <span>
            SMART PDF READER
          </span>

          <h1>
            {fileName}
          </h1>

        </div>

        <div className="smart-pdf-header-actions">

          <button
            onClick={decreaseZoom}
            title="Zoom out"
          >
            <ZoomOut size={17} />
          </button>

          <span>
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={increaseZoom}
            title="Zoom in"
          >
            <ZoomIn size={17} />
          </button>

          <button
            onClick={resetZoom}
            title="Reset zoom"
          >
            <RotateCcw size={17} />
          </button>

          <button
            onClick={downloadPdf}
            title="Download PDF"
          >
            <Download size={17} />
          </button>

        </div>

      </header>


      {/* ================= PAGE NAVIGATION ================= */}

      <div className="smart-pdf-navigation">

        <button
          onClick={previousPage}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        <div className="smart-page-counter">

          <strong>
            Page {pageNumber}
          </strong>

          <span>
            of {numPages || "..."}
          </span>

        </div>

        <button
          onClick={nextPage}
          disabled={
            !numPages || pageNumber >= numPages
          }
        >
          Next
          <ChevronRight size={18} />
        </button>

      </div>


      {/* ================= READING AREA ================= */}

      <section className="smart-pdf-body">

        <div className="smart-pdf-sidebar">

          <div className="sidebar-label">
            READING TOOLS
          </div>


          {/* PROGRESS */}

          <div className="pdf-progress-card">

            <span>
              READING PROGRESS
            </span>

            <strong>
              {numPages
                ? Math.round(
                    (pageNumber / numPages) * 100
                  )
                : 0}
              %
            </strong>

            <div className="pdf-progress-bar">

              <div
                style={{
                  width: `${
                    numPages
                      ? (pageNumber / numPages) * 100
                      : 0
                  }%`,
                }}
              />

            </div>

          </div>


          {/* BOOKMARK */}

          <button
            className={`pdf-tool-button ${
              bookmarked ? "active" : ""
            }`}
            onClick={toggleBookmark}
          >
            <Bookmark size={18} />

            <span>
              {bookmarked
                ? "Bookmarked"
                : "Bookmark Page"}
            </span>

          </button>


          {/* NOTE */}

          <button
            className="pdf-tool-button"
            onClick={() =>
              setShowNote((current) => !current)
            }
          >
            <FileText size={18} />

            <span>
              Add Note
            </span>

          </button>


          {/* TRANSLATE */}

          <button
            className={`pdf-tool-button ${
              showTranslation ? "active" : ""
            }`}
            onClick={translateText}
          >
            <Languages size={18} />

            <span>
              Translate
            </span>

          </button>


          {/* READ ALOUD */}

          <button
            className={`pdf-tool-button ${
              speaking ? "active" : ""
            }`}
            onClick={() => {
              if (!speaking) {
                startSpeaking();
              } else if (paused) {
                resumeSpeaking();
              } else {
                pauseSpeaking();
              }
            }}
          >
            {speaking && !paused ? (
              <Pause size={18} />
            ) : (
              <Mic size={18} />
            )}

            <span>
              {!speaking
                ? "Read Aloud"
                : paused
                ? "Resume"
                : "Pause"}
            </span>

          </button>


          {speaking && (
            <button
              className="pdf-tool-button stop-button"
              onClick={stopSpeaking}
            >
              <Square size={16} />

              <span>
                Stop
              </span>

            </button>
          )}

        </div>


        {/* ================= PDF PAGE ================= */}

        <div className="smart-pdf-document-area">

          <div className="smart-pdf-page-wrapper">

            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="pdf-loading">
                  <Headphones size={30} />
                  <h2>
                    Preparing your reading space...
                  </h2>
                  <p>
                    Loading your PDF
                  </p>
                </div>
              }
              error={
                <div className="pdf-loading">
                  <h2>
                    Unable to open PDF
                  </h2>
                  <p>
                    Please upload the PDF again.
                  </p>
                </div>
              }
            >

              <Page
                pageNumber={pageNumber}
                scale={zoom}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onGetTextSuccess={handleTextLayerSuccess}
              />

            </Document>

          </div>


          {/* ================= CURRENT SENTENCE ================= */}

          <div className="pdf-current-sentence">

            <div className="sentence-label">

              <Headphones size={15} />

              CURRENT PAGE TEXT

            </div>

            <p>
              {pageText
                ? pageText.slice(0, 180) +
                  (pageText.length > 180
                    ? "..."
                    : "")
                : "Select Read Aloud to listen to this page."}
            </p>

          </div>


          {/* ================= VOICE CONTROLS ================= */}

          <div className="pdf-voice-section">

            <div className="voice-title">
              <Headphones size={16} />
              Choose reading voice
            </div>

            <div className="voice-buttons">

              <button
                className={
                  voiceType === "female"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setVoiceType("female")
                }
              >
                ♀ Female Voice
              </button>

              <button
                className={
                  voiceType === "male"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setVoiceType("male")
                }
              >
                ♂ Male Voice
              </button>

            </div>

          </div>


          {/* ================= NOTE BOX ================= */}

          {showNote && (
            <div className="pdf-note-box">

              <div>
                <FileText size={18} />

                <strong>
                  Note for Page {pageNumber}
                </strong>
              </div>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                placeholder="Write your note here..."
              />

              <button
                onClick={() =>
                  setShowNote(false)
                }
              >
                Save Note
              </button>

            </div>
          )}


          {/* ================= TRANSLATION BOX ================= */}

          {showTranslation && (
            <div className="pdf-translation-box">

              <Languages size={20} />

              <div>

                <strong>
                  Translation
                </strong>

                <p>
                  Select or copy difficult text from
                  the PDF and use your preferred
                  translation service.
                </p>

              </div>

            </div>
          )}


          {/* ================= BOTTOM CONTROLS ================= */}

          <div className="pdf-bottom-controls">

            <button
              onClick={previousPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft size={17} />
              Previous Page
            </button>

            <div className="pdf-page-number">
              {pageNumber} / {numPages || "..."}
            </div>

            <button
              onClick={nextPage}
              disabled={
                !numPages ||
                pageNumber >= numPages
              }
            >
              Next Page
              <ChevronRight size={17} />
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}

export default PdfReader;