import {
    FileText,
    FolderOpen,
    Home,
    ScanLine,
} from "lucide-react";

function BottomNav({ activePage, onNavigate }) {
    const navItems = [
        {
            id: "home",
            label: "Home",
            icon: Home,
        },
        {
            id: "applications",
            label: "Lamaran",
            icon: FileText,
        },
        {
            id: "scan",
            label: "Scan",
            icon: ScanLine,
            primary: true,
        },
        {
            id: "documents",
            label: "CV",
            icon: FolderOpen,
        },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                if (item.primary) {
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className="nav-scan"
                            onClick={() => onNavigate(item.id)}
                            aria-label="Scan Lowongan"
                        >
                            <span>
                                <Icon size={21} strokeWidth={2.2} />
                            </span>

                            <small>{item.label}</small>
                        </button>
                    );
                }

                return (
                    <button
                        key={item.id}
                        type="button"
                        className={`nav-item ${isActive ? "active" : ""
                            }`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <Icon size={20} strokeWidth={2} />

                        <small>{item.label}</small>
                    </button>
                );
            })}
        </nav>
    );
}

export default BottomNav;