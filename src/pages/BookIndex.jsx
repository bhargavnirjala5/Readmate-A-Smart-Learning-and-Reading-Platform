import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

import janeEyreText from "../books/jane-eyre.txt?raw";
import prideText from "../books/pride-and-prejudice.txt?raw";
import aliceText from "../books/alice-in-wonderland.txt?raw";

const BOOKS = {
  "1": { title: "Jane Eyre", author: "Charlotte Brontë", text: janeEyreText },
  "2": { title: "Pride and Prejudice", author: "Jane Austen", text: prideText },
  "3": { title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", text: aliceText },
};

const WORDS =
  "ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY-ONE|TWENTY-TWO|TWENTY-THREE|TWENTY-FOUR|TWENTY-FIVE|TWENTY-SIX|TWENTY-SEVEN|TWENTY-EIGHT|TWENTY-NINE|THIRTY|THIRTY-ONE|THIRTY-TWO|THIRTY-THREE|THIRTY-FOUR|THIRTY-FIVE|THIRTY-SIX|THIRTY-SEVEN|THIRTY-EIGHT|THIRTY-NINE|FORTY";

const CHAPTER_RE = new RegExp(
  `(\\n|^)\\s*CHAPTER\\s+([IVXLCDM]+|\\d+|${WORDS})\\.?\\s*`,
  "gi"
);

function cleanText(text) {
  let value = (text || "")
    .replace(/\r/g, "")
    .replace(/\uFEFF/g, "")
    .trim();

  const start = value.match(
    /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i
  );
  if (start?.index !== undefined) value = value.slice(start.index + start[0].length);

  const end = value.match(
    /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i
  );
  if (end?.index !== undefined) value = value.slice(0, end.index);

  return value.trim();
}

function getChapters(text) {
  const clean = cleanText(text);
  const found = [];
  CHAPTER_RE.lastIndex = 0;

  let match;
  while ((match = CHAPTER_RE.exec(clean)) !== null) {
    found.push({
      key: String(match[2]).toUpperCase(),
      number: match[2],
      start: match.index + match[0].length,
    });
  }

  const last = new Map();
  found.forEach((item) => last.set(item.key, item));

  return Array.from(last.values())
    .sort((a, b) => a.start - b.start)
    .map((item, index) => ({
      id: String(index + 1),
      number: item.number,
      label: `CHAPTER ${String(index + 1).padStart(2, "0")}`,
    }));
}

export default function BookIndex() {
  const { bookId = "1" } = useParams();
  const book = BOOKS[String(bookId)] || BOOKS["1"];
  const chapters = useMemo(() => getChapters(book.text), [book.text]);

  return (
    <main className="readly-index-page">
      <style>{`
        .readly-index-page{min-height:100vh;background:#f7f1e8;color:#35241f;font-family:Arial,sans-serif;padding:28px}
        .readly-index-page *{box-sizing:border-box}
        .index-wrap{max-width:1080px;margin:auto}
        .index-back{display:inline-flex;align-items:center;gap:7px;color:#57231f;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:35px}
        .index-kicker{font-size:10px;letter-spacing:2px;color:#a96722;font-weight:800;text-transform:uppercase}
        .index-title{font-family:Georgia,serif;font-size:42px;color:#2e211d;margin:8px 0 4px}
        .index-author{font-family:Georgia,serif;color:#a36a37;margin-bottom:30px}
        .chapter-list{display:flex;flex-direction:column;gap:12px}
        .chapter-card{background:#fffefa;border:1px solid #e4d5c4;border-radius:16px;padding:18px 20px;display:grid;grid-template-columns:58px 1fr auto;align-items:center;gap:18px;text-decoration:none;color:#33231f;transition:.15s}
        .chapter-card:hover{border-color:#bd7a2d;transform:translateY(-1px)}
        .chapter-number{width:44px;height:44px;border-radius:12px;background:#f3e2ca;color:#78382b;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px}
        .chapter-name{font-family:Georgia,serif;font-size:21px}
        .chapter-small{font-size:10px;letter-spacing:1.5px;color:#a96722;font-weight:800;margin-bottom:5px}
        .chapter-open{width:42px;height:42px;border-radius:50%;background:#642522;color:#fff;display:flex;align-items:center;justify-content:center}
        .empty{background:#fffefa;border:1px solid #e4d5c4;border-radius:16px;padding:30px;font-family:Georgia,serif}
        @media(max-width:700px){.readly-index-page{padding:18px}.index-title{font-size:32px}.chapter-card{grid-template-columns:48px 1fr 38px;padding:14px}.chapter-name{font-size:18px}}
      `}</style>

      <div className="index-wrap">
        <Link className="index-back" to={`/book/${bookId}`}>
          <ArrowLeft size={16} /> Back to Book
        </Link>

        <div className="index-kicker">BOOK CHAPTERS</div>
        <h1 className="index-title">{book.title}</h1>
        <div className="index-author">{book.author}</div>

        <div className="chapter-list">
          {chapters.length ? (
            chapters.map((chapter, index) => (
              <Link
                key={chapter.id}
                className="chapter-card"
                to={`/book/${bookId}/read/${chapter.id}`}
              >
                <span className="chapter-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div className="chapter-small">CHAPTER</div>
                  <div className="chapter-name">Chapter {String(index + 1).padStart(2, "0")}</div>
                </div>
                <span className="chapter-open"><ArrowRight size={17} /></span>
              </Link>
            ))
          ) : (
            <div className="empty">No chapters found in this book file.</div>
          )}
        </div>
      </div>
    </main>
  );
}