export default function InfoField({ label, value, icon, iconBg, iconColor, locked = false, badge = null, verified = false }) {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
                        <i className={icon}></i>
                    </div>
                    <div className="flex items-center gap-2">
                        {badge ? (
                            badge
                        ) : (
                            <span className="text-base font-bold text-gray-900">{value}</span>
                        )}
                        {verified && (
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center" title="Verified">
                                <i className="fa-solid fa-check text-green-600 text-xs"></i>
                            </div>
                        )}
                    </div>
                </div>
                {locked && (
                    <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                        <i className="fa-solid fa-lock text-sm"></i>
                    </div>
                )}
            </div>
        </div>
    );
}
