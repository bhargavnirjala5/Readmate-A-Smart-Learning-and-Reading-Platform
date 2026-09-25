import janeEyreText from "./jane-eyre.txt?raw";
import pridePrejudiceText from "./pride-and-prejudice.txt?raw";
import aliceWonderlandText from "./alice-in-wonderland.txt?raw";

function cleanText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function parseChapters(text) {
  const cleaned = cleanText(text);

  // Supports:
  // CHAPTER I
  // CHAPTER I.
  // CHAPTER I. Down the Rabbit-Hole
  // Chapter 1
  const chapterRegex =
    /^\s*CHAPTER\s+([IVXLCDM]+|\d+)\.?\s*(.*?)\s*$/gim;

  const matches = [...cleaned.matchAll(chapterRegex)];

  if (matches.length === 0) {
    return [
      {
        id: "1",
        number: "01",
        title: "Full Book",
        content: cleaned,
      },
    ];
  }

  const chapters = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    const start = match.index + match[0].length;

    const end =
      i + 1 < matches.length
        ? matches[i + 1].index
        : cleaned.length;

    let content = cleaned.slice(start, end).trim();

    let title = match[2]?.trim();

    if (!title) {
      title = `Chapter ${match[1]}`;
    }

    content = content
      .replace(/^\s*[-_=]{3,}\s*/g, "")
      .trim();

    chapters.push({
      id: String(i + 1),
      number: String(i + 1).padStart(2, "0"),
      title,
      content,
    });
  }

  return chapters;
}

const books = {
  "1": {
    id: "1",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    category: "Classic",
    description:
      "A powerful story of independence, courage, love, and Jane Eyre's journey through life.",
    text: janeEyreText,
  },

  "2": {
    id: "2",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Classic",
    description:
      "A classic story of love, relationships, family, misunderstandings, and understanding others.",
    text: pridePrejudiceText,
  },

  "3": {
    id: "3",
    title: "Alice in Wonderland",
    author: "Lewis Carroll",
    category: "Classic",
    description:
      "Follow Alice into a magical world filled with strange characters, adventures, and imagination.",
    text: aliceWonderlandText,
  },
};

Object.values(books).forEach((book) => {
  book.chapters = parseChapters(book.text);
});

export function getBook(bookId) {
  return books[bookId] || books["1"];
}

export default books;