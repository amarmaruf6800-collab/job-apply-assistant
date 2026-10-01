import { useEffect, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    FileSearch,
    LoaderCircle,
    ScanLine,
    ShieldCheck,
} from "lucide-react";

import ImageUploader from "../components/ImageUploader";
import ScanButton from "../components/ScanButton";

import {
    scanImage,
    decodeQRCode,
} from "../services/ocrService";
import { parseJobText } from "../services/jobParser";

function Scan({ onNavigate }) {
    const [image, setImage] = useState(null);

    const [isScanning, setIsScanning] = useState(false);

    const [scanProgress, setScanProgress] = useState(0);

    const [scanStep, setScanStep] = useState(0);

    const [error, setError] = useState("");

    const scanSteps = [
        "Membaca gambar",
        "Mendeteksi teks",
        "Menganalisis informasi lowongan",
    ];

    useEffect(() => {
        if (!isScanning) return;

        if (scanProgress >= 20) {
            setScanStep(1);
        }

        if (scanProgress >= 70) {
            setScanStep(2);
        }
    }, [scanProgress, isScanning]);

    const handleImageSelect = (file) => {
        if (image?.preview) {
            URL.revokeObjectURL(image.preview);
        }

        const preview = URL.createObjectURL(file);

        setImage({
            file,
            preview,
        });

        setError("");
        setScanProgress(0);
        setScanStep(0);
    };

    const handleRemove = () => {
        if (image?.preview) {
            URL.revokeObjectURL(image.preview);
        }

        setImage(null);
        setError("");
        setIsScanning(false);
        setScanProgress(0);
        setScanStep(0);
    };

    const handleScan = async () => {
        if (!image?.file) return;

        setIsScanning(true);
        setError("");
        setScanProgress(0);
        setScanStep(0);

        try {
            const [text, qrData] = await Promise.all([
                scanImage(
                    image.file,
                    (progress) => {
                        setScanProgress(progress);
                    }
                ),
                decodeQRCode(image.file).catch((qrError) => {
                    console.error(
                        "Gagal membaca QR Code:",
                        qrError
                    );
                    return "";
                }),
            ]);

            const parsedData = parseJobText(
                text,
                qrData
            );

            console.log("========== OCR RAW TEXT ==========");
            console.log(text);

            console.log("========== OCR LINES ==========");
            console.table(
                text
                    .split("\n")
                    .map((line, index) => ({
                        no: index + 1,
                        text: line,
                    }))
                    .filter((item) => item.text.trim())
            );

            console.log("========== PARSED DATA ==========");
            console.table(parsedData);

            // Simpan hasil sementara
            sessionStorage.setItem(
                "scannedJob",
                JSON.stringify(parsedData)
            );

            sessionStorage.setItem(
                "scannedImage",
                image.preview
            );

            setScanProgress(100);
            setScanStep(2);

            setTimeout(() => {
                setIsScanning(false);

                onNavigate("review");
            }, 700);
        } catch (err) {
            console.error(err);

            setError(
                "Gagal membaca gambar. Pastikan screenshot cukup jelas lalu coba lagi."
            );

            setIsScanning(false);
        }
    };

    return (
        <div className="page scan-page">
            <header className="scan-header">
                <button
                    type="button"
                    className="back-button"
                    onClick={() => onNavigate("home")}
                >
                    <ArrowLeft size={19} />
                </button>

                <div>
                    <p className="section-eyebrow">SCAN</p>

                    <h1>Scan Lowongan</h1>
                </div>
            </header>

            <p className="scan-description">
                Upload screenshot lowongan dan aplikasi akan membaca
                informasi pekerjaan secara otomatis.
            </p>

            <section className="scan-card">
                <div className="scan-card-heading">
                    <div className="scan-card-icon">
                        <ScanLine size={20} />
                    </div>

                    <div>
                        <h2>Screenshot Lowongan</h2>

                        <p>
                            Gunakan screenshot yang jelas agar hasil
                            pembacaan lebih akurat.
                        </p>
                    </div>
                </div>

                <ImageUploader
                    image={image}
                    onImageSelect={handleImageSelect}
                    onRemove={handleRemove}
                />

                {image && !isScanning && (
                    <div className="scan-action">
                        <ScanButton onClick={handleScan}>
                            Mulai Scan
                        </ScanButton>
                    </div>
                )}
            </section>

            {error && (
                <div className="scan-error">
                    <strong>Scan gagal</strong>

                    <p>{error}</p>
                </div>
            )}

            {isScanning && (
                <section className="scanning-card">
                    <div className="scanning-animation">
                        <LoaderCircle
                            size={32}
                            className="spinning"
                        />
                    </div>

                    <p className="section-eyebrow">
                        ANALYZING {scanProgress}%
                    </p>

                    <h2>Menganalisis lowongan...</h2>

                    <p>
                        Sistem sedang membaca teks dari screenshot.
                    </p>

                    <div className="scan-progress">
                        <div
                            className="scan-progress-bar"
                            style={{
                                width: `${scanProgress}%`,
                            }}
                        />
                    </div>

                    <div className="scan-steps">
                        {scanSteps.map((step, index) => {
                            const completed = index < scanStep;
                            const current = index === scanStep;

                            return (
                                <div
                                    key={step}
                                    className={`scan-step ${completed ? "completed" : ""
                                        } ${current ? "current" : ""}`}
                                >
                                    <span>
                                        {completed ? (
                                            <CheckCircle2 size={16} />
                                        ) : (
                                            <span className="step-dot" />
                                        )}
                                    </span>

                                    <p>{step}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            <div className="scan-security">
                <ShieldCheck size={17} />

                <p>
                    Untuk versi pengembangan ini, OCR berjalan di
                    browser dan belum mengirim gambar ke server.
                </p>
            </div>
        </div>
    );
}

export default Scan;