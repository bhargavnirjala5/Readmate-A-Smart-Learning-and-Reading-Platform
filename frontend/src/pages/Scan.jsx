import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  ScanLine,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import Tesseract from "tesseract.js";
import "../App.css";

function Scan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [image, setImage] = useState(null);
  const [recognizedText, setRecognizedText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // CLEANUP CAMERA
  // =====================================================

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // =====================================================
  // START CAMERA
  // =====================================================

  const startCamera = async () => {
    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera is not supported by this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
          width: {
            ideal: 1920,
          },
          height: {
            ideal: 1080,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);
    } catch (cameraError) {
      console.error("Camera error:", cameraError);

      setError(
        "Camera access nahi mil raha. Browser settings mein camera permission allow karo."
      );
    }
  };

  // =====================================================
  // STOP CAMERA
  // =====================================================

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  // =====================================================
  // CAPTURE PHOTO
  // =====================================================

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setError(
        "Camera image ready nahi hai. Thoda wait karke dobara capture karo."
      );
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Image capture nahi ho saka.");
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData = canvas.toDataURL(
      "image/jpeg",
      0.95
    );

    setImage(imageData);
    setRecognizedText("");
    setProgress(0);
    setError("");

    stopCamera();
  };

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please ek image file select karo.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Image size 15 MB se kam honi chahiye.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
      setRecognizedText("");
      setProgress(0);
      setError("");
    };

    reader.onerror = () => {
      setError("Image load nahi ho saki.");
    };

    reader.readAsDataURL(file);

    // Same file dobara select karne ke liye
    event.target.value = "";
  };

  // =====================================================
  // PREPARE IMAGE FOR OCR
  // =====================================================

  const prepareImageForOCR = (sourceImage) => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");

          const originalWidth =
            img.naturalWidth || img.width;

          const originalHeight =
            img.naturalHeight || img.height;

          if (!originalWidth || !originalHeight) {
            reject(
              new Error("Invalid image dimensions.")
            );
            return;
          }

          /*
           * OCR ke liye image ko upscale karte hain.
           * Small text recognition mein help karta hai.
           */

          const scale = Math.max(
            1,
            Math.min(
              2,
              1800 / originalWidth
            )
          );

          canvas.width = Math.round(
            originalWidth * scale
          );

          canvas.height = Math.round(
            originalHeight * scale
          );

          const context = canvas.getContext(
            "2d",
            {
              willReadFrequently: true,
            }
          );

          if (!context) {
            reject(
              new Error(
                "Canvas context unavailable."
              )
            );
            return;
          }

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";

          context.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );

          /*
           * Grayscale + contrast improvement.
           * Printed book pages ke OCR ko improve karta hai.
           */

          const imageData =
            context.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );

          const pixels = imageData.data;

          for (
            let i = 0;
            i < pixels.length;
            i += 4
          ) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            const gray =
              0.299 * r +
              0.587 * g +
              0.114 * b;

            const enhanced = Math.max(
              0,
              Math.min(
                255,
                (gray - 128) * 1.25 + 128
              )
            );

            pixels[i] = enhanced;
            pixels[i + 1] = enhanced;
            pixels[i + 2] = enhanced;
          }

          context.putImageData(
            imageData,
            0,
            0
          );

          resolve(
            canvas.toDataURL("image/png")
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(
          new Error(
            "Image could not be loaded."
          )
        );
      };

      img.src = sourceImage;
    });
  };

  // =====================================================
  // OCR SCAN
  // =====================================================

  const scanImage = async () => {
    if (!image) {
      setError(
        "Pehle image capture ya upload karo."
      );
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setRecognizedText("");
    setError("");
    setCopied(false);

    try {
      // Prepare image
      const processedImage =
        await prepareImageForOCR(image);

      // Run Tesseract OCR
      const result =
        await Tesseract.recognize(
          processedImage,
          "eng",
          {
            logger: (message) => {
              if (
                message.status ===
                "recognizing text"
              ) {
                const currentProgress =
                  Math.round(
                    (message.progress || 0) * 100
                  );

                setProgress(currentProgress);
              }
            },
          }
        );

      const text =
        result?.data?.text?.trim() || "";

      if (!text) {
        setError(
          "Text recognize nahi hua. Please book page ki clear aur straight image upload/capture karo."
        );

        setRecognizedText("");
        return;
      }

      setRecognizedText(text);
      setProgress(100);

      /*
       * OCR result ke saath image bhi save karo.
       * Isse agar page refresh ho jaye tab bhi
       * scanned image Reader mein use ki ja sakti hai.
       */

      localStorage.setItem(
        "scannedBookText",
        text
      );

      localStorage.setItem(
        "scannedBookImage",
        image
      );
    } catch (ocrError) {
      console.error("OCR error:", ocrError);

      setError(
        "OCR scan complete nahi ho saka. Internet connection check karo aur clear book-page image try karo."
      );

      setRecognizedText("");
    } finally {
      setIsScanning(false);
    }
  };

  // =====================================================
  // COPY TEXT
  // =====================================================

  const copyText = async () => {
    if (!recognizedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        recognizedText
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (copyError) {
      console.error(
        "Copy error:",
        copyError
      );

      setError("Text copy nahi ho saka.");
    }
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetScan = () => {
    stopCamera();

    setImage(null);
    setRecognizedText("");
    setProgress(0);
    setCopied(false);
    setError("");
    setIsScanning(false);

    // Purana scanned data remove karo
    localStorage.removeItem(
      "scannedBookText"
    );

    localStorage.removeItem(
      "scannedBookImage"
    );
  };

  // =====================================================
  // OPEN OCR TEXT + IMAGE IN READER
  // =====================================================

  const openInReader = () => {
    if (!recognizedText || !image) {
      return;
    }

    // OCR text save
    localStorage.setItem(
      "scannedBookText",
      recognizedText
    );

    // Original uploaded/captured image save
    localStorage.setItem(
      "scannedBookImage",
      image
    );

    // Reader open
    window.location.href =
      "/book/1/read/1?mode=scanned";
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="scan-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="scan-hero">

        <div className="scan-badge">
          <Sparkles size={15} />
          SMART CAMERA OCR
        </div>

        <h1>
          Scan a Book Page
        </h1>

        <p>
          Capture a printed page and turn it
          into editable, readable text using OCR.
        </p>

      </section>

      {/* =================================================
          MAIN WORKSPACE
      ================================================= */}

      <section className="scan-workspace">

        {/* =================================================
            LEFT PANEL
        ================================================= */}

        <div className="scan-camera-panel">

          <div className="scan-panel-header">

            <div>

              <span>
                PAGE SCANNER
              </span>

              <h2>
                Capture your page
              </h2>

            </div>

            <ScanLine size={22} />

          </div>

          {/* =================================================
              PREVIEW
          ================================================= */}

          <div className="scanner-preview">

            {/* EMPTY */}

            {!image &&
              !cameraActive && (
                <div className="scanner-empty">

                  <div className="scanner-empty-icon">
                    <Camera size={32} />
                  </div>

                  <h3>
                    Ready to scan
                  </h3>

                  <p>
                    Place your book page inside
                    the camera or upload an
                    existing image.
                  </p>

                </div>
              )}

            {/* CAMERA */}

            {cameraActive && (
              <div className="camera-view">

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                />

                <div className="camera-frame">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="camera-label">
                  Align the book page inside
                  the frame
                </div>

              </div>
            )}

            {/* CAPTURED / UPLOADED IMAGE */}

            {image &&
              !cameraActive && (
                <div className="captured-image-container">

                  <img
                    src={image}
                    alt="Captured book page"
                    className="captured-image"
                  />

                  <div className="image-status">
                    <Check size={15} />
                    Page captured
                  </div>

                </div>
              )}

          </div>

          {/* =================================================
              CONTROLS
          ================================================= */}

          <div className="scanner-controls">

            {/* START */}

            {!cameraActive &&
              !image && (
                <>
                  <button
                    type="button"
                    className="scan-primary-button"
                    onClick={startCamera}
                  >
                    <Camera size={18} />
                    Open Camera
                  </button>

                  <label className="scan-secondary-button">

                    <Upload size={18} />

                    Upload Image

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleImageUpload
                      }
                      hidden
                    />

                  </label>
                </>
              )}

            {/* CAMERA ACTIVE */}

            {cameraActive && (
              <>
                <button
                  type="button"
                  className="capture-button"
                  onClick={capturePhoto}
                >
                  <Camera size={19} />
                  Capture Page
                </button>

                <button
                  type="button"
                  className="cancel-camera-button"
                  onClick={stopCamera}
                >
                  Cancel
                </button>
              </>
            )}

            {/* IMAGE READY */}

            {image &&
              !cameraActive && (
                <>
                  <button
                    type="button"
                    className="scan-primary-button"
                    onClick={scanImage}
                    disabled={isScanning}
                  >
                    <ScanLine size={18} />

                    {isScanning
                      ? `Scanning ${progress}%`
                      : "Extract Text"}
                  </button>

                  <button
                    type="button"
                    className="scan-reset-button"
                    onClick={resetScan}
                    disabled={isScanning}
                  >
                    <RotateCcw size={17} />
                    New Scan
                  </button>
                </>
              )}

          </div>

          {/* =================================================
              PROGRESS
          ================================================= */}

          {isScanning && (
            <div className="ocr-progress">

              <div className="ocr-progress-top">

                <span>
                  Reading page...
                </span>

                <strong>
                  {progress}%
                </strong>

              </div>

              <div className="ocr-progress-bar">

                <span
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="scan-error">
              {error}
            </div>
          )}

          {/* =================================================
              HIDDEN CANVAS
          ================================================= */}

          <canvas
            ref={canvasRef}
            hidden
          />

        </div>

        {/* =================================================
            RIGHT OCR RESULT
        ================================================= */}

        <div className="scan-result-panel">

          <div className="scan-panel-header">

            <div>

              <span>
                OCR RESULT
              </span>

              <h2>
                Extracted Text
              </h2>

            </div>

            <FileText size={22} />

          </div>

          <div className="ocr-result-box">

            {/* EMPTY */}

            {!recognizedText &&
              !isScanning && (
                <div className="ocr-empty">

                  <div className="ocr-empty-icon">
                    <FileText size={28} />
                  </div>

                  <h3>
                    Your text will appear here
                  </h3>

                  <p>
                    Scan a page and the recognized
                    text will be displayed here.
                  </p>

                </div>
              )}

            {/* SCANNING */}

            {isScanning && (
              <div className="ocr-scanning">

                <div className="ocr-spinner">
                  <ScanLine size={25} />
                </div>

                <h3>
                  Reading your page...
                </h3>

                <p>
                  OCR is converting the scanned
                  image into readable text.
                </p>

              </div>
            )}

            {/* RESULT */}

            {recognizedText &&
              !isScanning && (
                <textarea
                  className="ocr-textarea"
                  value={recognizedText}
                  onChange={(event) =>
                    setRecognizedText(
                      event.target.value
                    )
                  }
                  spellCheck="false"
                />
              )}

          </div>

          {/* =================================================
              RESULT ACTIONS
          ================================================= */}

          {recognizedText &&
            !isScanning && (
              <div className="ocr-actions">

                <button
                  type="button"
                  className="copy-text-button"
                  onClick={copyText}
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Text
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="reader-text-button"
                  onClick={openInReader}
                >
                  <BookOpen size={16} />
                  Open in Reader
                  <ArrowRight size={15} />
                </button>

              </div>
            )}

        </div>

      </section>

      {/* =================================================
          HOW IT WORKS
      ================================================= */}

      <section className="scan-how-section">

        <div className="scan-how-heading">

          <span>
            HOW IT WORKS
          </span>

          <h2>
            Turn a printed page into a reading page.
          </h2>

        </div>

        <div className="scan-steps">

          <div className="scan-step">

            <div className="scan-step-number">
              01
            </div>

            <Camera size={21} />

            <h3>
              Capture
            </h3>

            <p>
              Take a clear photo of your book page.
            </p>

          </div>

          <div className="scan-step">

            <div className="scan-step-number">
              02
            </div>

            <ScanLine size={21} />

            <h3>
              Recognize
            </h3>

            <p>
              OCR detects the printed words automatically.
            </p>

          </div>

          <div className="scan-step">

            <div className="scan-step-number">
              03
            </div>

            <FileText size={21} />

            <h3>
              Read
            </h3>

            <p>
              Edit the extracted text and continue reading.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Scan;