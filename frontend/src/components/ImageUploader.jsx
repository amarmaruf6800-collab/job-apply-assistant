import { useRef } from "react";
import {
    ImagePlus,
    Upload,
    X,
    RefreshCw,
} from "lucide-react";

function ImageUploader({
    image,
    onImageSelect,
    onRemove,
}) {
    const inputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("File yang dipilih harus berupa gambar.");
            return;
        }

        onImageSelect(file);

        // Supaya file yang sama bisa dipilih lagi
        event.target.value = "";
    };

    const openFilePicker = () => {
        inputRef.current?.click();
    };

    return (
        <div className="image-uploader">
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                hidden
            />

            {!image ? (
                <button
                    type="button"
                    className="upload-zone"
                    onClick={openFilePicker}
                >
                    <div className="upload-icon">
                        <ImagePlus size={27} />
                    </div>

                    <h3>Upload screenshot</h3>

                    <p>
                        Pilih gambar lowongan dari perangkat kamu
                    </p>

                    <span className="upload-formats">
                        JPG · PNG · WEBP
                    </span>

                    <span className="upload-action">
                        <Upload size={16} />
                        Pilih Gambar
                    </span>
                </button>
            ) : (
                <div className="image-preview-wrapper">
                    <div className="image-preview">
                        <img
                            src={image.preview}
                            alt="Screenshot lowongan"
                        />

                        <button
                            type="button"
                            className="remove-image"
                            onClick={onRemove}
                            aria-label="Hapus gambar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="image-info">
                        <div>
                            <strong>{image.file.name}</strong>

                            <span>
                                {(image.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>

                        <button
                            type="button"
                            className="change-image"
                            onClick={openFilePicker}
                        >
                            <RefreshCw size={15} />
                            Ganti
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImageUploader;