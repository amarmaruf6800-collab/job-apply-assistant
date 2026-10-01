import {
    ArrowUpRight,
    Building2,
} from "lucide-react";

function ApplicationCard({
    company,
    position,
    location,
    status = "Draft",
    date,
    onClick,
}) {
    return (
        <button
            className="application-card"
            onClick={onClick}
        >
            <div className="application-card-icon">
                <Building2 size={20} />
            </div>

            <div className="application-card-content">
                <div className="application-card-top">
                    <span>{company}</span>

                    <span className="application-status">
                        {status}
                    </span>
                </div>

                <h3>{position}</h3>

                <p>
                    {location}
                    {date && ` · ${date}`}
                </p>
            </div>

            <ArrowUpRight
                size={18}
                className="application-arrow"
            />
        </button>
    );
}

export default ApplicationCard;