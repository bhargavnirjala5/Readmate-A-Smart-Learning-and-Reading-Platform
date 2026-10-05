import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Globe,
  Headphones,
  Highlighter,
  Languages,
  Mic,
  MicOff,
  Pause,
  Play,
  StickyNote,
  X,
} from "lucide-react";

import janeEyreText from "../books/jane-eyre.txt?raw";
import prideText from "../books/pride-and-prejudice.txt?raw";
import aliceText from "../books/alice-in-wonderland.txt?raw";

const BOOKS = {
  "1": {
    id: "1",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    text: janeEyreText,
  },
  "2": {
    id: "2",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    text: prideText,
  },
  "3": {
    id: "3",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    text: aliceText,
  },
};

const PAGE_SIZE = 1650;
const BOOKMARK_KEY = "readly_bookmarks";
const NOTES_KEY = "readly_notes";
const READING_PROGRESS_KEY = "readly_reading_progress";
const READING_ACTIVITY_KEY = "readly_reading_activity";

function cleanText(text) {
  if (!text) return "";

  let value = text
    .replace(/\r/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/\[Illustration[^\]]*\]/gi, "")
    .replace(/_([^_]+)_/g, "$1")
    .trim();

  const start = value.match(
    /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i
  );
  if (start?.index !== undefined) {
    value = value.slice(start.index + start[0].length);
  }

  const end = value.match(
    /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i
  );
  if (end?.index !== undefined) {
    value = value.slice(0, end.index);
  }

  return value.replace(/\n{3,}/g, "\n\n").trim();
}

const NUMBER_WORDS =
  "ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY-ONE|TWENTY-TWO|TWENTY-THREE|TWENTY-FOUR|TWENTY-FIVE|TWENTY-SIX|TWENTY-SEVEN|TWENTY-EIGHT|TWENTY-NINE|THIRTY|THIRTY-ONE|THIRTY-TWO|THIRTY-THREE|THIRTY-FOUR|THIRTY-FIVE|THIRTY-SIX|THIRTY-SEVEN|THIRTY-EIGHT|THIRTY-NINE|FORTY";

const CHAPTER_RE = new RegExp(
  `(\\n|^)\\s*CHAPTER\\s+([IVXLCDM]+|\\d+|${NUMBER_WORDS})\\.?\\s*`,
  "gi"
);

function chapterKey(number) {
  return String(number).toUpperCase().replace(/\.$/, "");
}

function splitParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitLongParagraph(text) {
  if (text.length <= PAGE_SIZE) return [text];

  const sentences =
    text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const pieces = [];
  let current = "";

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) continue;

    if (
      current &&
      current.length + cleanSentence.length + 1 > PAGE_SIZE
    ) {
      pieces.push(current.trim());
      current = cleanSentence;
    } else {
      current += (current ? " " : "") + cleanSentence;
    }
  }

  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

function makePages(paragraphs) {
  const pages = [];
  let current = [];
  let length = 0;

  const pushPage = () => {
    if (current.length) {
      pages.push(current);
      current = [];
      length = 0;
    }
  };

  paragraphs.forEach((paragraph) => {
    splitLongParagraph(paragraph).forEach((piece) => {
      if (current.length && length + piece.length > PAGE_SIZE) {
        pushPage();
      }

      current.push(piece);
      length += piece.length + 2;
    });
  });

  pushPage();
  return pages;
}

const BOOK_OPENINGS = {
  "1": "There was no possibility of taking a walk that day.",
  "2": "It is a truth universally acknowledged",
  "3": "Alice was beginning to get very tired of sitting by her sister",
};

function normalizeForSearch(value) {
  return String(value || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findOpeningIndex(text, opening) {
  if (!opening) return -1;
  const exact = text.toLowerCase().indexOf(opening.toLowerCase());
  if (exact >= 0) return exact;

  const normalizedText = normalizeForSearch(text);
  const normalizedOpening = normalizeForSearch(opening);
  const pos = normalizedText.indexOf(normalizedOpening);
  if (pos < 0) return -1;

  // Convert normalized position approximately back to the original string.
  // This fallback is only used when line wrapping differs in the source file.
  let compactCount = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (!/\s/.test(text[i])) compactCount += 1;
    if (compactCount >= pos) return i;
  }
  return -1;
}

function cleanChapterTitle(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { body: text.trim(), title: "" };

  const first = lines[0];
  if (
    first.length <= 100 &&
    !/[.!?]$/.test(first) &&
    !/^I\b|^It\b|^We\b|^The\b|^There\b|^Alice\b|^He\b|^She\b/i.test(first)
  ) {
    return { title: first, body: lines.slice(1).join("\n").trim() };
  }

  return { body: text.trim(), title: "" };
}

function parseBook(rawText, bookId = "1") {
  const fullText = cleanText(rawText);
  if (!fullText) return [];

  /*
   * IMPORTANT:
   * Project Gutenberg files often contain a Contents/TOC section before the
   * real chapters. If we parse the first "CHAPTER I" blindly, Alice can end
   * up showing "CHAPTER II" as the page content. Start from the actual first
   * sentence of the book instead. This also prevents Pride and Prejudice from
   * jumping into a later volume/duplicate chapter.
   */
  const opening = BOOK_OPENINGS[String(bookId)];
  const openingIndex = findOpeningIndex(fullText, opening);
  const text = openingIndex >= 0 ? fullText.slice(openingIndex).trim() : fullText;

  const matches = [];
  CHAPTER_RE.lastIndex = 0;

  let match;
  while ((match = CHAPTER_RE.exec(text)) !== null) {
    matches.push({
      key: chapterKey(match[2]),
      number: match[2],
      start: match.index + match[0].length,
    });
  }

  // Because `text` starts at the first actual sentence, the first chapter
  // heading is normally before index 0 and therefore not available. We create
  // Chapter 1 from the opening sentence, then use subsequent headings as
  // boundaries.
  const laterMatches = matches.filter((item) => item.start > 0);

  // Remove duplicate chapter numbers while preserving their first occurrence
  // AFTER the real book opening. This is important for multi-volume editions.
  const seen = new Set();
  const uniqueLaterMatches = laterMatches.filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });

  const boundaries = [
    { key: "1", number: "1", start: 0 },
    ...uniqueLaterMatches,
  ].sort((a, b) => a.start - b.start);

  // If the source does not contain usable chapter headings, still show the
  // complete book from its real beginning.
  if (boundaries.length === 1) {
    const paragraphs = splitParagraphs(text);
    return paragraphs.length
      ? [{
          id: "1",
          number: "1",
          title: "CHAPTER 01",
          paragraphs,
          pages: makePages(paragraphs),
        }]
      : [];
  }

  const chapters = boundaries.map((item, index) => {
    const end = index + 1 < boundaries.length ? boundaries[index + 1].start : text.length;
    let chapterText = text.slice(item.start, end).trim();

    // For Alice, the real title is on the line immediately after the chapter
    // heading. Keep that title for the reader header but do not repeat it in
    // the body text.
    const cleaned = cleanChapterTitle(chapterText);
    const paragraphs = splitParagraphs(cleaned.body);

    let title = `CHAPTER ${String(index + 1).padStart(2, "0")}`;
    if (cleaned.title) title = cleaned.title;

    return {
      id: String(index + 1),
      number: item.number,
      title,
      paragraphs,
      pages: makePages(paragraphs),
    };
  });

  return chapters.filter((chapter) => chapter.pages.length > 0);
}

function splitSentences(text) {
  return (
    text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ||
    [text]
  );
}

export default function Reader() {
  const { bookId = "1", chapterId = "1" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // IMPORTANT: normal book reading NEVER reads old OCR/scanned localStorage.
  // Scanned content is shown only when the URL explicitly contains ?mode=scanned.
  const isScannedMode = new URLSearchParams(location.search).get("mode") === "scanned";

  // Keep scanned OCR data in React state so the Reader updates immediately
  // after coming back from the Scanner. This avoids needing a manual refresh.
  const readScannedData = () => {
    if (!isScannedMode) return { text: "", image: "" };

    return {
      text:
        localStorage.getItem("scannedBookText") ||
        localStorage.getItem("readly_scanned_text") ||
        localStorage.getItem("scannedText") ||
        localStorage.getItem("ocrText") ||
        "",
      image: localStorage.getItem("scannedBookImage") || "",
    };
  };

  const [scannedData, setScannedData] = useState(() => readScannedData());

  useEffect(() => {
    // Re-read localStorage whenever Reader enters scanned mode.
    // The storage event alone is not enough because it does not fire
    // in the same browser tab that made the change.
    if (!isScannedMode) {
      setScannedData({ text: "", image: "" });
      return;
    }

    setScannedData(readScannedData());
  }, [isScannedMode, location.pathname, location.search]);

  const scannedText = isScannedMode ? scannedData.text : "";

  const normalBook = BOOKS[String(bookId)] || BOOKS["1"];

  const book = isScannedMode
    ? {
        id: "scanned",
        title: "Scanned Page",
        author: "OCR Scanned Text",
        text: scannedText,
      }
    : normalBook;

  const chapters = useMemo(() => {
    if (isScannedMode) {
      const paragraphs = splitParagraphs(cleanText(scannedText));

      return [
        {
          id: "1",
          number: "1",
          title: "SCANNED PAGE",
          paragraphs,
          pages: makePages(paragraphs),
        },
      ];
    }

    return parseBook(book.text, bookId);
  }, [book.text, bookId, isScannedMode, scannedText]);

  // If Scanner has just navigated here, wait for the scanned text state
  // to be populated instead of rendering an empty reader.
  if (isScannedMode && !scannedText) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f1e8",
          color: "#35241f",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            background: "#fffefa",
            border: "1px solid #eadfd2",
            borderRadius: 16,
            padding: "28px 34px",
            textAlign: "center",
            boxShadow: "0 12px 30px rgba(71,45,33,.07)",
          }}
        >
          <h2 style={{ margin: "0 0 8px" }}>Opening scanned page...</h2>
          <p style={{ margin: 0, color: "#7d675d" }}>
            Please wait while the scanned text is loaded.
          </p>
        </div>
      </main>
    );
  }

  const chapterIndex = Math.max(
    0,
    chapters.findIndex((item) => String(item.id) === String(chapterId))
  );
  const chapter = chapters[chapterIndex] || chapters[0];

  const savedProgress = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || "{}");
      return saved[String(bookId)] || null;
    } catch {
      return null;
    }
  })();

  const [pageIndex, setPageIndex] = useState(
    !isScannedMode && savedProgress?.chapterId === String(chapterId)
      ? Math.min(Number(savedProgress.pageIndex) || 0, Math.max((chapter?.pages?.length || 1) - 1, 0))
      : 0
  );
  const [fontSize, setFontSize] = useState(18);
  const [voiceType, setVoiceType] = useState(
    () => localStorage.getItem("readly_voice_type") || "female"
  );
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(-1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [readAloudResult, setReadAloudResult] = useState(null);
  const [showReadAloudResult, setShowReadAloudResult] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [note, setNote] = useState("");
  const [highlightMode, setHighlightMode] = useState(false);
  const [translation, setTranslation] = useState("");
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const recognitionRef = useRef(null);
  const translationHistoryRef = useRef(false);

  useEffect(() => {
    let nextPage = 0;

    if (!isScannedMode) {
      try {
        const saved = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || "{}");
        if (saved[String(bookId)]?.chapterId === String(chapterId)) {
          nextPage = Math.min(
            Number(saved[String(bookId)].pageIndex) || 0,
            Math.max((chapter?.pages?.length || 1) - 1, 0)
          );
        }
      } catch {
        nextPage = 0;
      }
    }

    setPageIndex(nextPage);
    setCurrentSentence(-1);
    setIsPlaying(false);
    window.speechSynthesis?.cancel();
  }, [bookId, chapterId, isScannedMode, location.pathname, location.search]);

  // Browser voices can load a little after the page itself loads.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices?.() || [];
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("readly_voice_type", voiceType);
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setCurrentSentence(-1);
  }, [voiceType]);

  useEffect(() => {
    if (!chapter) return;
    const key = `${BOOKMARK_KEY}_${bookId}_${chapterId}`;
    setIsBookmarked(localStorage.getItem(key) === "true");
  }, [bookId, chapterId, chapter]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
    };
  }, []);

  // Browser Back should close the translation modal before navigating away
  // from the Reader page.
  useEffect(() => {
    const handlePopState = () => {
      if (!translationHistoryRef.current) return;

      translationHistoryRef.current = false;
      setShowTranslation(false);
      setTranslation("");
      setTranslationError("");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const currentPage = chapter?.pages?.[pageIndex] || [];
  const pageText = currentPage.join(" ");
  const sentences = useMemo(() => splitSentences(pageText), [pageText]);

  const progress = chapters.length
    ? Math.min(
        100,
        Math.round(
          ((chapterIndex + (pageIndex + 1) / Math.max(chapter.pages.length, 1)) /
            chapters.length) *
            100
        )
      )
    : 0;

  // Save the reader position so Dashboard can show real progress and resume reading.
  useEffect(() => {
    if (!chapter || isScannedMode) return;

    try {
      const allProgress = JSON.parse(localStorage.getItem(READING_PROGRESS_KEY) || "{}");
      const safePageIndex = Math.min(pageIndex, Math.max(chapter.pages.length - 1, 0));
      const percentage = chapters.length
        ? Math.min(100, Math.round(((chapterIndex + (safePageIndex + 1) / Math.max(chapter.pages.length, 1)) / chapters.length) * 100))
        : 0;

      allProgress[String(bookId)] = {
        bookId: String(bookId),
        chapterId: String(chapterId),
        pageIndex: safePageIndex,
        chapterIndex,
        progress: percentage,
        updatedAt: Date.now(),
      };

      localStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(allProgress));

      const activity = JSON.parse(localStorage.getItem(READING_ACTIVITY_KEY) || "{}");
      const today = new Date().toISOString().slice(0, 10);
      activity.lastReadDate = today;
      activity.lastUpdated = Date.now();
      localStorage.setItem(READING_ACTIVITY_KEY, JSON.stringify(activity));

      window.dispatchEvent(new Event("readly-data-updated"));
    } catch (error) {
      console.error("Error saving reading progress:", error);
    }
  }, [bookId, chapterId, chapterIndex, pageIndex, chapters.length, chapter, isScannedMode]);

  const goChapter = (index) => {
    const target = chapters[index];
    if (!target) return;
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    navigate(`/book/${bookId}/read/${target.id}${isScannedMode ? "?mode=scanned" : ""}`);
  };

  const nextPage = () => {
    if (pageIndex < chapter.pages.length - 1) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      setCurrentSentence(-1);
      setPageIndex((p) => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (chapterIndex < chapters.length - 1) {
      goChapter(chapterIndex + 1);
    }
  };

  const previousPage = () => {
    if (pageIndex > 0) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      setCurrentSentence(-1);
      setPageIndex((p) => p - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (chapterIndex > 0) {
      const previous = chapters[chapterIndex - 1];
      navigate(`/book/${bookId}/read/${previous.id}${isScannedMode ? "?mode=scanned" : ""}`);
    }
  };

  const findVoice = () => {
    const browserVoices =
      availableVoices.length
        ? availableVoices
        : window.speechSynthesis?.getVoices?.() || [];

    if (!browserVoices.length) return null;

    const english = browserVoices.filter((v) =>
      v.lang?.toLowerCase().startsWith("en")
    );
    const list = english.length ? english : browserVoices;

    const femaleNames =
      /zira|samantha|karen|susan|aria|jenny|victoria|hazel|sara|libby|sonia|ava|emma|olivia|moira|fiona|female/i;

    const maleNames =
      /david|mark|guy|ryan|george|daniel|james|thomas|alex|fred|ralph|michael|arthur|brian|eric|male/i;

    const pattern = voiceType === "female" ? femaleNames : maleNames;
    const matching = list.find((voice) => pattern.test(voice.name));

    if (matching) return matching;

    // Extra matching for common Microsoft/Google voice identifiers.
    if (voiceType === "male") {
      const likelyMale = list.find((voice) =>
        /microsoft.*(david|mark|guy|ryan|george|james|thomas)|google.*(male|en-us-wavenet-d|en-us-wavenet-b)/i.test(
          `${voice.name} ${voice.voiceURI}`
        )
      );
      if (likelyMale) return likelyMale;
    }

    if (voiceType === "female") {
      const likelyFemale = list.find((voice) =>
        /microsoft.*(zira|aria|jenny|sara|libby)|google.*(female|en-us-wavenet-c|en-us-wavenet-e)/i.test(
          `${voice.name} ${voice.voiceURI}`
        )
      );
      if (likelyFemale) return likelyFemale;
    }

    // Some browsers do not expose gender information at all.
    // In that case use the first English voice available.
    return list[0] || null;
  };

  const playFrom = (start = 0) => {
    if (!sentences.length) {
      alert("There is no text available to read on this page.");
      return;
    }

    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      alert("Text-to-speech is not supported in this browser. Please open the project in Chrome or Edge.");
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    let index = Math.max(0, Math.min(start, sentences.length - 1));

    // Update the visible sentence immediately. This prevents the UI from
    // getting stuck on "Pause" with an empty "NOW READING" area.
    setCurrentSentence(index);
    setIsPlaying(true);

    const speakNext = () => {
      if (index >= sentences.length) {
        setIsPlaying(false);
        setCurrentSentence(-1);
        return;
      }

      const text = String(sentences[index] || "").trim();

      if (!text) {
        index += 1;
        speakNext();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = findVoice();

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || "en-US";
      } else {
        utterance.lang = "en-US";
      }

      utterance.rate = 0.92;
      utterance.pitch = voiceType === "female" ? 1.05 : 0.9;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentSentence(index);
      };

      utterance.onend = () => {
        index += 1;

        if (index < sentences.length) {
          window.setTimeout(speakNext, 100);
        } else {
          setIsPlaying(false);
          setCurrentSentence(-1);
        }
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event?.error || event);
        setIsPlaying(false);
        setCurrentSentence(-1);

        if (event?.error !== "canceled" && event?.error !== "interrupted") {
          alert("Voice playback could not start. Please press Listen again.");
        }
      };

      try {
        synth.speak(utterance);

        // Chromium/Edge sometimes leaves synthesis paused after cancel().
        window.setTimeout(() => {
          try {
            if (synth.paused) synth.resume();
          } catch {}
        }, 150);
      } catch (error) {
        console.error("Unable to start speech synthesis:", error);
        setIsPlaying(false);
        setCurrentSentence(-1);
      }
    };

    // Let cancel() finish before speaking the new utterance.
    window.setTimeout(speakNext, 80);
  };

  const toggleListen = () => {
    if (window.speechSynthesis?.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }

    if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    playFrom(currentSentence >= 0 ? currentSentence : 0);
  };

  const stopListen = () => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setCurrentSentence(-1);
  };

  const toggleBookmark = () => {
    const key = `${BOOKMARK_KEY}_${bookId}_${chapterId}`;
    const next = !isBookmarked;
    localStorage.setItem(key, String(next));
    setIsBookmarked(next);

    try {
      const stored = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || "[]");
      const bookmarks = Array.isArray(stored) ? stored : [];
      const bookmarkId = `${bookId}-${chapterId}`;
      const filtered = bookmarks.filter(
        (item) => String(item?.id || "") !== bookmarkId
      );

      if (next) {
        filtered.push({
          id: bookmarkId,
          bookId: Number(bookId),
          chapterId: Number(chapterId),
          book: book.title,
          chapter: chapter.title,
          page: pageIndex + 1,
          text: pageText.slice(0, 180),
          time: "Just now",
        });
      }

      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event("readly-data-updated"));
    } catch (error) {
      console.error("Error saving bookmark:", error);
    }
  };

  const normalizeSpeech = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[“”‘’]/g, "")
      .replace(/[^a-z0-9\s']/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const compareReading = (expected, spoken) => {
    const expectedWords = normalizeSpeech(expected).split(" ").filter(Boolean);
    const spokenWords = normalizeSpeech(spoken).split(" ").filter(Boolean);

    if (!expectedWords.length) {
      return { accuracy: 0, correctWords: [], wrongWords: [], missingWords: [] };
    }

    const correctWords = [];
    const wrongWords = [];
    const missingWords = [];
    let spokenIndex = 0;

    expectedWords.forEach((word) => {
      const current = spokenWords[spokenIndex];

      if (current === word) {
        correctWords.push(word);
        spokenIndex += 1;
        return;
      }

      const next = spokenWords[spokenIndex + 1];

      if (next === word) {
        if (current) wrongWords.push(current);
        correctWords.push(word);
        spokenIndex += 2;
        return;
      }

      missingWords.push(word);
    });

    return {
      accuracy: Math.min(
        100,
        Math.round((correctWords.length / expectedWords.length) * 100)
      ),
      correctWords,
      wrongWords: wrongWords.filter(Boolean),
      missingWords,
    };
  };

  const handleReadAloud = () => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      alert("Read Aloud is supported in Chrome or Edge.");
      return;
    }

    if (!sentences.length) {
      alert("There is no sentence available to read.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const targetIndex = currentSentence >= 0 ? currentSentence : 0;
    const targetSentence = sentences[targetIndex];

    setCurrentSentence(targetIndex);
    setSpokenText("");
    setReadAloudResult(null);
    setShowReadAloudResult(false);

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript + " ";
      }

      transcript = transcript.trim();
      setSpokenText(transcript);

      const lastResult = event.results[event.results.length - 1];

      if (lastResult?.isFinal) {
        const result = compareReading(targetSentence, transcript);
        setReadAloudResult(result);
        setShowReadAloudResult(true);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        alert("Please allow microphone permission for Read Aloud.");
      } else if (event.error === "no-speech") {
        alert("I could not hear your voice. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const openTranslationHistory = () => {
    if (translationHistoryRef.current) return;

    // Add a same-page history entry so browser Back closes the translation
    // modal first instead of leaving the Reader page.
    window.history.pushState(
      { ...(window.history.state || {}), readlyTranslation: true },
      "",
      window.location.href
    );
    translationHistoryRef.current = true;
  };

  const closeTranslation = () => {
    if (translationHistoryRef.current) {
      window.history.back();
      return;
    }

    setShowTranslation(false);
    setTranslation("");
    setTranslationError("");
  };

  const translateCurrentSentence = async () => {
    const source = currentSentence >= 0 ? sentences[currentSentence] : "";

    openTranslationHistory();
    setShowTranslation(true);
    setTranslation("");
    setTranslationError("");

    if (!source) {
      setTranslationError("Please select a sentence first.");
      return;
    }

    setTranslationLoading(true);

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(source)}&langpair=en|hi`
      );

      if (!response.ok) throw new Error("Translation request failed");

      const data = await response.json();
      const translated = data?.responseData?.translatedText?.trim();

      if (!translated) throw new Error("No translation returned");

      setTranslation(translated);
    } catch (error) {
      setTranslationError(
        "Translation service is unavailable. Please check your internet connection and try again."
      );
    } finally {
      setTranslationLoading(false);
    }
  };

  const saveNote = () => {
    if (!note.trim()) return;

    const existing = JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
    existing.push({
      id: Date.now(),
      bookId: Number(bookId),
      chapterId: Number(chapterId),
      book: book.title,
      chapter: chapter.title,
      text: note.trim(),
      page: pageIndex + 1,
      time: "Just now",
    });

    localStorage.setItem(NOTES_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event("readly-data-updated"));
    setNote("");
    setShowNote(false);
  };

  if (!chapter) {
    return (
      <main style={{ padding: 40, background: "#f7f1e8", minHeight: "100vh" }}>
        <h2>Book content is loading...</h2>
      </main>
    );
  }

  return (
    <main className="readly-reader">
      <style>{`
        .readly-reader{min-height:100vh;background:#f7f1e8;color:#35241f;font-family:Arial,sans-serif}
        .readly-reader *{box-sizing:border-box}
        .readly-top{height:70px;background:#fffdf9;border-bottom:1px solid #eadfd1;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 30px;position:sticky;top:0;z-index:20}
        .readly-back{display:flex;align-items:center;gap:7px;color:#57231f;text-decoration:none;font-size:14px;font-weight:600}
        .readly-book-title{display:flex;align-items:center;gap:9px;font-family:Georgia,serif;font-size:20px;font-weight:700;color:#57231f}
        .readly-book-title small{font-size:14px;font-weight:400;color:#8d6a5d}
        .readly-top-actions{display:flex;justify-content:flex-end;gap:8px}
        .readly-top-actions button{height:38px;border:1px solid #e5d8ca;background:#fffdf9;border-radius:10px;color:#4a2b25;display:flex;align-items:center;gap:6px;padding:0 12px;cursor:pointer}
        .readly-body{width:100%;max-width:1600px;margin:0 auto;padding:18px 24px 28px;display:grid;grid-template-columns:240px minmax(0,1fr) 270px;gap:24px;align-items:start}
        .readly-label{font-size:12px;font-weight:800;letter-spacing:1.2px;color:#4a3029;margin:0 0 12px 4px;display:block}
        .readly-chapter-list{height:calc(100vh - 220px);min-height:480px;overflow-y:auto;padding-right:6px}
        .readly-chapter-list::-webkit-scrollbar{width:7px}.readly-chapter-list::-webkit-scrollbar-thumb{background:#5b2522;border-radius:10px}
        .readly-chapter{width:100%;min-height:58px;margin-bottom:8px;border:1px solid #e7dacc;background:#fffdf9;border-radius:12px;padding:9px 10px;display:grid;grid-template-columns:35px 1fr 18px;align-items:center;gap:8px;text-align:left;color:#3d2923;cursor:pointer}
        .readly-chapter.active{background:#5b211f;color:white;border-color:#5b211f}
        .readly-chapter-number{width:32px;height:32px;border-radius:50%;background:#f5e9d8;color:#7a3b2c;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800}.readly-chapter.active .readly-chapter-number{background:#fff;color:#5b211f}
        .readly-chapter-title{font-size:12px;line-height:1.35;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .readly-progress{margin-top:12px;background:#fffdf9;border:1px solid #e7dacc;border-radius:14px;padding:14px}.readly-progress-top{display:flex;justify-content:space-between;font-size:10px;font-weight:800;letter-spacing:.7px}.readly-progress-top strong{font-size:17px;letter-spacing:0}.readly-progress-track{height:5px;background:#eadfce;border-radius:99px;margin:12px 0}.readly-progress-track span{display:block;height:100%;background:#642522;border-radius:99px}
        .readly-paper{background:#fffefa;border:1px solid #eadfd2;border-radius:18px;box-shadow:0 12px 30px rgba(71,45,33,.07);padding:30px 52px 18px;height:calc(100vh - 2px);min-height:720px;display:flex;flex-direction:column;overflow:hidden;text-align:left}
        .readly-ornament{display:flex;align-items:center;gap:14px;color:#bd7a2d;margin-bottom:22px}.readly-ornament:before,.readly-ornament:after{content:"";height:1px;background:#e2c69e;flex:1}
        .readly-header{text-align:center}.readly-header .chapter-no{font-size:12px;letter-spacing:2px;color:#a96722;font-weight:800}.readly-header h1{font-family:Georgia,serif;font-size:24px;line-height:1.25;margin:13px 0 8px;color:#2e211d;font-weight:600}.readly-header p{font-family:Georgia,serif;font-size:14px;color:#ad6c2c;margin:0 0 26px}
        .readly-text{font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.72;color:#302622;text-align:left;width:100%;max-width:900px;margin:0 auto;flex:1;min-height:0;overflow:hidden}.readly-text p{margin:0 0 18px;text-align:left;display:block;width:100%}.readly-sentence{cursor:pointer;border-radius:4px;padding:1px 2px}.readly-sentence.active{background:#f6e5a7}.readly-sentence.marked{background:#f4df9a}
        .readly-tools{display:flex;flex-direction:column;gap:14px}.readly-card{background:#fffdf9;border:1px solid #e7dacc;border-radius:14px;padding:15px;box-shadow:0 5px 16px rgba(71,45,33,.04)}.readly-card-title{text-align:center;font-size:12px;font-weight:800;letter-spacing:.8px;margin-bottom:12px;color:#49332d}.readly-tool-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.readly-tool{min-height:70px;border:1px solid #eadfd3;background:#fbf4ea;border-radius:10px;color:#392723;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font-size:11px;cursor:pointer}.readly-tool.active{background:#5b211f;color:white;border-color:#5b211f}
        .readly-voice{display:flex;flex-direction:column;gap:7px}.readly-voice button{border:1px solid #e7dacc;background:#fbf4ea;border-radius:9px;padding:10px;cursor:pointer;font-size:11px;color:#412c27}.readly-voice button.active{background:#5b211f;color:white;border-color:#5b211f}
        .readly-player-controls{display:flex;align-items:center;justify-content:center;gap:10px}.readly-player-controls button{border:1px solid #e3d5c7;background:#fbf4ea;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#5b211f}.readly-player-controls .main{width:54px;height:54px;background:#5b211f;color:white;border-color:#5b211f}
        .readly-current{margin-top:15px;border-top:1px solid #eadfd2;padding-top:12px}.readly-current small{display:block;font-size:9px;font-weight:800;letter-spacing:1px;color:#9b725f;margin-bottom:5px}.readly-current div{font-family:Georgia,serif;font-size:12px;line-height:1.5}
        .readly-read-result{margin-top:12px;padding-top:12px;border-top:1px solid #eadfd2}.readly-read-result-title{font-size:10px;font-weight:800;letter-spacing:.8px;color:#49332d;margin-bottom:6px}.readly-accuracy{font-size:24px;font-weight:800;color:#5b211f}.readly-spoken{font-size:11px;line-height:1.5;color:#6d574f;margin-top:5px}.readly-retry{margin-top:9px;width:100%;border:1px solid #e3d5c7;background:#fbf4ea;border-radius:9px;padding:8px;cursor:pointer;color:#5b211f;font-size:11px;font-weight:700}
        .readly-footer{border-top:1px solid #eadfd2;margin-top:10px;padding-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px}.readly-footer button{border:1px solid #e6d9cc;background:#fffdf9;border-radius:9px;padding:9px 12px;display:flex;align-items:center;gap:5px;color:#6b453a;cursor:pointer;font-size:11px}.readly-footer button:disabled{opacity:.4;cursor:not-allowed}.readly-page-count{font-size:11px;color:#7c665d;font-weight:700}
        .readly-modal-bg{position:fixed;inset:0;background:rgba(32,20,16,.28);display:flex;align-items:center;justify-content:center;z-index:50}.readly-modal{width:min(500px,92vw);background:#fffefa;border-radius:16px;padding:20px;border:1px solid #e5d8ca}.readly-modal-head{display:flex;justify-content:space-between;align-items:center}.readly-modal-head button{border:0;background:none;cursor:pointer}.readly-modal textarea{width:100%;min-height:150px;margin:15px 0;padding:12px;border:1px solid #e2d5c8;border-radius:10px;font-family:Arial}.readly-save{background:#5b211f;color:white;border:0;border-radius:9px;padding:10px 16px;cursor:pointer}
        @media(max-width:1050px){.readly-body{grid-template-columns:210px minmax(0,1fr)}.readly-tools{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr)}}
        @media(max-width:800px){.readly-top{grid-template-columns:1fr auto;padding:0 14px}.readly-book-title{display:none}.readly-body{grid-template-columns:1fr;padding:16px}.readly-chapter-list{height:auto;max-height:300px;min-height:0}.readly-paper{padding:28px 22px;height:auto;min-height:0;overflow:visible}.readly-header h1{font-size:22px}.readly-text{font-size:17px}.readly-tools{grid-template-columns:1fr}}
      `}</style>

      <header className="readly-top">
        {isScannedMode ? (
          <button
            className="readly-back"
            type="button"
            onClick={() => navigate(-1)}
            style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }}
          >
            <ArrowLeft size={15} /> Back to Scanner
          </button>
        ) : (
          <Link className="readly-back" to={`/book/${bookId}/index`}>
            <ArrowLeft size={15} /> Back to Index
          </Link>
        )}

        <div className="readly-book-title">
          <span>▣</span>
          {book.title}
          <small>• {book.author}</small>
        </div>

        <div className="readly-top-actions">
          <button onClick={toggleBookmark} title="Bookmark">
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
          <button onClick={translateCurrentSentence}>
            <Globe size={15} /> Translate
          </button>
          <button onClick={() => setFontSize((v) => Math.max(16, v - 2))}>A−</button>
          <button onClick={() => setFontSize((v) => Math.min(22, v + 2))}>A+</button>
        </div>
      </header>

      <section className="readly-body">
        <aside>
          <span className="readly-label">CHAPTERS</span>
          <div className="readly-chapter-list">
            {chapters.map((item, index) => (
              <button
                key={item.id}
                className={`readly-chapter ${index === chapterIndex ? "active" : ""}`}
                onClick={() => goChapter(index)}
              >
                <span className="readly-chapter-number">{String(index + 1).padStart(2, "0")}</span>
                <strong className="readly-chapter-title">CHAPTER {String(index + 1).padStart(2, "0")}</strong>
                {index === chapterIndex ? <ChevronRight size={14} /> : null}
              </button>
            ))}
          </div>

          <div className="readly-progress">
            <div className="readly-progress-top"><span>READING PROGRESS</span><strong>{Math.min(progress, 100)}%</strong></div>
            <div className="readly-progress-track"><span style={{ width: `${Math.min(progress, 100)}%` }} /></div>
            <small>Chapter {chapterIndex + 1} of {chapters.length}</small>
          </div>
        </aside>

        <article className="readly-paper">
          <div className="readly-ornament"><span>❧</span></div>

          <header className="readly-header">
            <div className="chapter-no">CHAPTER {String(chapterIndex + 1).padStart(2, "0")}</div>
            <h1>{chapter.title}</h1>
            <p>♢ {book.author}</p>
          </header>

          <div className="readly-text" style={{ fontSize: `${fontSize}px` }}>
            {currentPage.map((paragraph, pIndex) => {
              const parts = splitSentences(paragraph);
              return (
                <p key={pIndex}>
                  {parts.map((sentence, sIndex) => {
                    const global = currentPage
                      .slice(0, pIndex)
                      .flatMap(splitSentences).length + sIndex;
                    const active = global === currentSentence;
                    return (
                      <span
                        key={`${pIndex}-${sIndex}`}
                        className={`readly-sentence ${active ? "active" : ""} ${highlightMode && active ? "marked" : ""}`}
                        onClick={() => setCurrentSentence(global)}
                      >
                        {sentence} {" "}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>

          <div className="readly-footer">
            <button onClick={previousPage} disabled={chapterIndex === 0 && pageIndex === 0}>
              <ChevronLeft size={15} /> Previous Page
            </button>
            <span className="readly-page-count">Page {pageIndex + 1} of {chapter.pages.length}</span>
            <button onClick={nextPage} disabled={chapterIndex === chapters.length - 1 && pageIndex === chapter.pages.length - 1}>
              Next Page <ChevronRight size={15} />
            </button>
          </div>
        </article>

        <aside className="readly-tools">
          <div className="readly-card">
            <div className="readly-card-title">READING TOOLS</div>
            <div className="readly-tool-grid">
              <button className={`readly-tool ${isPlaying ? "active" : ""}`} onClick={toggleListen}><Headphones size={19} />Listen</button>
              <button
                className={`readly-tool ${isListening ? "active" : ""}`}
                onClick={handleReadAloud}
              >
                {isListening ? <MicOff size={19} /> : <Mic size={19} />}
                {isListening ? "Listening..." : "Read Aloud"}
              </button>
              <button className={`readly-tool ${highlightMode ? "active" : ""}`} onClick={() => setHighlightMode((v) => !v)}><Highlighter size={19} />Highlight</button>
              <button className="readly-tool" onClick={() => setShowNote(true)}><StickyNote size={19} />Note</button>
              <button className="readly-tool" onClick={translateCurrentSentence}><Languages size={19} />Translate</button>
              <button className={`readly-tool ${isBookmarked ? "active" : ""}`} onClick={toggleBookmark}>{isBookmarked ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}Bookmark</button>
            </div>
          </div>

          <div className="readly-card">
            <div className="readly-card-title">VOICE</div>
            <div className="readly-voice">
              <button className={voiceType === "female" ? "active" : ""} onClick={() => setVoiceType("female")}>♀ Female Voice</button>
              <button className={voiceType === "male" ? "active" : ""} onClick={() => setVoiceType("male")}>♂ Male Voice</button>
            </div>
          </div>

          <div className="readly-card">
            <div className="readly-card-title">PLAYER</div>
            <div className="readly-player-controls">
              <button onClick={() => setCurrentSentence(Math.max(0, currentSentence - 1))}><ChevronLeft size={17} /></button>
              <button className="main" onClick={toggleListen}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
              <button
                onClick={() =>
                  setCurrentSentence((current) =>
                    Math.min(sentences.length - 1, Math.max(0, current + 1))
                  )
                }
              >
                <ChevronRight size={17} />
              </button>
            </div>
            <div className="readly-current">
              <small>{isPlaying ? "NOW READING" : "CURRENT SENTENCE"}</small>
              <div>{currentSentence >= 0 ? sentences[currentSentence] : "Press Listen to start reading."}</div>
            </div>
            {showReadAloudResult && readAloudResult && (
              <div className="readly-read-result">
                <div className="readly-read-result-title">READING RESULT</div>
                <div className="readly-accuracy">{readAloudResult.accuracy}%</div>
                <div className="readly-spoken">
                  <strong>You said:</strong> {spokenText || "No speech detected."}
                </div>
                <button
                  className="readly-retry"
                  onClick={() => {
                    setShowReadAloudResult(false);
                    setReadAloudResult(null);
                    setSpokenText("");
                    handleReadAloud();
                  }}
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </aside>
      </section>

      {showNote && (
        <div className="readly-modal-bg">
          <div className="readly-modal">
            <div className="readly-modal-head"><strong>Add Note</strong><button onClick={() => setShowNote(false)}><X size={17} /></button></div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write your note..." />
            <button className="readly-save" onClick={saveNote}>Save Note</button>
          </div>
        </div>
      )}

      {showTranslation && (
        <div className="readly-modal-bg">
          <div className="readly-modal">
            <div className="readly-modal-head">
              <strong>English → Hindi Translation</strong>
              <button onClick={closeTranslation}><X size={17} /></button>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: "#9b725f", marginBottom: 7 }}>
                ENGLISH
              </div>
              <p style={{ fontFamily: "Georgia,serif", lineHeight: 1.7, marginTop: 0 }}>
                {currentSentence >= 0 ? sentences[currentSentence] : "Select a sentence first."}
              </p>
            </div>

            <div style={{ borderTop: "1px solid #eadfd2", marginTop: 14, paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: "#9b725f", marginBottom: 7 }}>
                HINDI
              </div>
              {translationLoading ? (
                <p style={{ color: "#7d675d", margin: 0 }}>Translating...</p>
              ) : translationError ? (
                <p style={{ color: "#9a4036", margin: 0, lineHeight: 1.6 }}>{translationError}</p>
              ) : (
                <p style={{ fontFamily: "Arial,sans-serif", lineHeight: 1.8, margin: 0, fontSize: 16 }}>
                  {translation || "Translation will appear here."}
                </p>
              )}
            </div>

            {!translationLoading && !translationError && translation && (
              <p style={{ color: "#7d675d", fontSize: 12, marginBottom: 0 }}>
                Translated using an online translation service.
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}