export default function Column({ title, count, color, icon, children }) {
    const themes = {
        amber: {
            header: "bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600",
            glow: "shadow-amber-500/20",
            border: "border-amber-500/20",
            iconBg: "bg-amber-700/50",
            badge: "bg-black/30 text-amber-100"
        },
        blue: {
            header: "bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600",
            glow: "shadow-blue-500/20",
            border: "border-blue-500/20",
            iconBg: "bg-blue-700/50",
            badge: "bg-black/30 text-blue-100"
        },
        emerald: {
            header: "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600",
            glow: "shadow-emerald-500/20",
            border: "border-emerald-500/20",
            iconBg: "bg-emerald-700/50",
            badge: "bg-black/30 text-emerald-100"
        },
    };

    const theme = themes[color] || themes.amber;

    return (
        <div className={`
            flex-1 flex flex-col min-w-[320px] md:min-w-[360px]
            bg-gradient-to-b from-[#1a1d24] to-[#12141a] 
            rounded-2xl overflow-hidden 
            shadow-2xl ${theme.glow}
            border ${theme.border}
            transition-all duration-300 hover:shadow-3xl
        `}>
            {/* Header với Gradient */}
            <div className={`
                relative py-4 px-5 flex items-center justify-between 
                ${theme.header}
                shadow-lg
            `}>
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
                
                <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-10 h-10 rounded-xl ${theme.iconBg} backdrop-blur-sm flex items-center justify-center text-white text-lg shadow-inner`}>
                        {icon}
                    </div>
                    <span className="text-base md:text-lg font-black tracking-wider text-white uppercase font-momo drop-shadow-md">
                        {title}
                    </span>
                </div>
                
                <span className={`
                    relative z-10 px-4 py-1.5 rounded-full text-sm font-black font-mono
                    ${theme.badge} backdrop-blur-sm shadow-inner
                `}>
                    {count}
                </span>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                {children}
            </div>
        </div>
    );
}