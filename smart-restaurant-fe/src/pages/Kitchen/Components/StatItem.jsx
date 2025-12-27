

export default function StatItem({ label, count, color, animate }) {
    return (
        <div className={`px-4 py-1 text-center min-w-[80px] ${animate ? 'animate-pulse' : ''}`}>
            <div className={`text-2xl font-bold leading-none ${color}`}>{count}</div>
            <div className="text-[10px] font-bold text-gray-500 mt-1 tracking-wider">{label}</div>
        </div>
    );
}