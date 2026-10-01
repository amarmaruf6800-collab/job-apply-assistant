import { ArrowUpRight, ScanLine } from "lucide-react";

function ScanButton({
    onClick,
    children = "Scan Lowongan",
}) {
    return (
        <button
            className="primary-button"
            onClick={onClick}
        >
            <ScanLine size={19} />

            {children}

            <ArrowUpRight size={18} />
        </button>
    );
}

export default ScanButton;