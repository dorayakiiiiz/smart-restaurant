import { STATUS_BADGES } from '../../../../utils/helper';

// ============ STATUS BADGE COMPONENT ============
export default function StatusBadge({ status }) {
    const badge = STATUS_BADGES[status] || STATUS_BADGES.pending;
    
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${badge.color}`}>
            <i className={`fa-solid ${badge.icon}`}></i>
            {badge.text}
        </span>
    );
}
