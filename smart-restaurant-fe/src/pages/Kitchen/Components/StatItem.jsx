export default function StatItem({ label, count, color, animate }) {
    const colorMap = {
        'text-amber-500': 'from-amber-500 to-orange-500',
        'text-blue-500': 'from-blue-500 to-cyan-500',
        'text-emerald-500': 'from-emerald-500 to-teal-500',
        'text-red-500': 'from-red-500 to-rose-500',
    };

    const glowMap = {
        'text-amber-500': 'shadow-amber-500/30',
        'text-blue-500': 'shadow-blue-500/30',
        'text-emerald-500': 'shadow-emerald-500/30',
        'text-red-500': 'shadow-red-500/30',
    };

    return (
        <div className={`
            group flex flex-col items-center justify-center px-4 md:px-6 py-2
            transition-all duration-300 cursor-default select-none
            ${animate ? 'animate-pulse' : ''}
        `}>
            <div className={`
                relative text-2xl md:text-3xl font-black leading-none font-mono
                bg-gradient-to-r ${colorMap[color]} bg-clip-text text-transparent
                drop-shadow-lg transition-transform group-hover:scale-110
            `}>
                {count}
                {animate && count > 0 && (
                    <span className={`absolute -top-1 -right-2 w-2 h-2 rounded-full bg-gradient-to-r ${colorMap[color]} animate-ping`}></span>
                )}
            </div>
            <div className="text-[9px] md:text-[10px] font-bold text-gray-400 mt-1.5 tracking-[0.2em] uppercase">
                {label}
            </div>
        </div>
    );
}