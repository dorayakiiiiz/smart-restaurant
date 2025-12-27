

export default function Column({ title, count, color, icon, children }) {
    const headerColors = {
        amber: "bg-[#F59E0B]",
        blue: "bg-[#3B82F6]",
        emerald: "bg-[#10B981]",
    };

    return (
        <div className="flex-1 flex flex-col bg-[#1F2937] rounded-xl overflow-hidden shadow-xl border border-gray-700">
            <div className={`p-3 flex items-center justify-between ${headerColors[color]}`}>
                <div className="flex items-center gap-2 text-white font-bold tracking-wide">
                    <span className="text-lg opacity-90">{icon}</span>
                    <span>{title}</span>
                </div>
                <span className="bg-black/20 text-white px-3 py-0.5 rounded-full text-sm font-bold">
                    {count}
                </span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar bg-[#111827]/50">
                {children}
            </div>
        </div>
    );
}