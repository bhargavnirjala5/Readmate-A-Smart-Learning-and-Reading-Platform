import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  FileText,
  X,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFile = (selectedFile) => {
    setError("");

    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setError("Please select a PDF file only.");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("PDF size must be 50 MB or less.");
      return;
    }

    const fileUrl = URL.createObjectURL(selectedFile);

    setFile({
      file: selectedFile,
      name: selectedFile.name,
      size: selectedFile.size,
      url: fileUrl,
    });
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    if (file?.url) {
      URL.revokeObjectURL(file.url);
    }

    setFile(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const openReader = () => {
    if (!file) return;

    navigate("/pdf-reader", {
      state: {
        fileUrl: file.url,
        fileName: file.name,
      },
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <main className="upload-page">

      <section className="upload-container">

        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={17} />
          Back to Home
        </button>

        <div className="upload-heading">
          <span className="section-label">
            YOUR READING SPACE
          </span>

          <h1>Upload a Book</h1>

          <p>
            Upload your PDF and open it directly in your reading space.
          </p>
        </div>

        {!file ? (
          <div
            className="upload-drop-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleInputChange}
              hidden
            />

            <div className="upload-main-icon">
              <UploadIcon size={34} />
            </div>

            <h2>Drop your PDF here</h2>

            <p>
              or choose a PDF file from your computer
            </p>

            <button
              type="button"
              className="upload-select-button"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <UploadIcon size={17} />
              Choose PDF
            </button>

            <span className="upload-limit">
              PDF files up to 50 MB
            </span>
          </div>
        ) : (
          <div className="uploaded-file-card">

            <div className="uploaded-file-icon">
              <FileText size={28} />
            </div>

            <div className="uploaded-file-details">
              <span className="uploaded-label">
                PDF READY
              </span>

              <h2>{file.name}</h2>

              <p>
                {formatFileSize(file.size)}
              </p>
            </div>

            <CheckCircle2
              className="uploaded-success"
              size={23}
            />

            <button
              className="remove-upload"
              onClick={removeFile}
              aria-label="Remove PDF"
            >
              <X size={18} />
            </button>

          </div>
        )}

        {error && (
          <div className="upload-error">
            {error}
          </div>
        )}

        {file && (
          <div className="upload-actions">

            <button
              className="secondary-upload-action"
              onClick={removeFile}
            >
              Choose Another
            </button>

            <button
              className="primary-upload-action"
              onClick={openReader}
            >
              <BookOpen size={18} />
              Open in Reader
            </button>

          </div>
        )}

        <div className="upload-info">

          <div>
            <FileText size={18} />
            <span>
              Your PDF stays available in this reading session.
            </span>
          </div>

          <div>
            <BookOpen size={18} />
            <span>
              Open the uploaded book in the dedicated reader.
            </span>
          </div>

        </div>

      </section>

    </main>
  );
}

export default Upload;