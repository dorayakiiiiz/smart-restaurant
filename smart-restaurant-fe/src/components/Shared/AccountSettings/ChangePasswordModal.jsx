export default function ChangePasswordModal({ isOpen, onClose, onSubmit, form, setForm, loading, message }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {message.content && (
                    <div className={`mb-4 p-3 ${message.type === 'success' ? 'bg-green-50 border border-green-100 text-green-600' : 'bg-red-50 border border-red-100 text-red-600'} text-sm rounded-xl flex items-center gap-2`}>
                        <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                        {message.content}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Current Password</label>
                        <input 
                            type="password"
                            required
                            value={form.currentPassword}
                            onChange={e => setForm({...form, currentPassword: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                        <input 
                            type="password"
                            required
                            value={form.newPassword}
                            onChange={e => setForm({...form, newPassword: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                        <input 
                            type="password"
                            required
                            value={form.confirmPassword}
                            onChange={e => setForm({...form, confirmPassword: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-[#800020] text-white font-bold rounded-xl hover:bg-[#600018] transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-6"
                    >
                        {loading && <i className="fa-solid fa-circle-notch fa-spin"></i>}
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
}
