import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { userService } from "../../../services/userService";
import ChangePasswordModal from "./ChangePasswordModal";

export default function AccountSettingsModal({ isOpen, onClose }) {
    const { user, setUser } = useAuth();
    
    // Tab state
    const [activeTab, setActiveTab] = useState("info");
    
    // Name edit state
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(user?.fullName || "");
    const [updatingName, setUpdatingName] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Password modal state
    const [showPassModal, setShowPassModal] = useState(false);
    const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg] = useState({ type: "", content: "" });
    
    // Close confirmation state
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    if (!isOpen) return null;

    const getRoleBadge = () => {
        const roleMap = {
            super_admin: { label: "Super Admin", color: "bg-red-100 text-red-800 ring-1 ring-red-200/70" },
            admin: { label: "Restaurant Admin", color: "bg-rose-50 text-rose-700 ring-1 ring-rose-100" },
            waiter: { label: "Waiter", color: "bg-blue-50 text-blue-700 ring-1 ring-blue-100" },
            kitchen: { label: "Kitchen Staff", color: "bg-orange-50 text-orange-700 ring-1 ring-orange-100" }
        };
        return roleMap[user?.role] || { label: user?.role, color: "bg-gray-50 text-gray-700 ring-1 ring-gray-200" };
    };

    // ============ Modal Handlers ============
    const handleClose = () => {
        if (hasUnsavedChanges) {
            setShowCloseConfirm(true);
        } else {
            onClose();
        }
    };

    const confirmClose = () => {
        setHasUnsavedChanges(false);
        setShowCloseConfirm(false);
        setIsEditingName(false);
        setTempName(user?.fullName);
        onClose();
    };

    // ============ Name Edit Handlers ============
    const handleEditName = () => {
        setIsEditingName(true);
        setTempName(user?.fullName);
    };

    const handleSaveName = async () => {
        if (!tempName.trim()) return;
        setUpdatingName(true);
        try {
            const res = await userService.updateAccountInfo({ fullName: tempName });
            setUser({ ...user, fullName: res.user.fullName });
            setIsEditingName(false);
            setHasUnsavedChanges(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update name");
        } finally {
            setUpdatingName(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingName(false);
        setTempName(user?.fullName);
        setHasUnsavedChanges(false);
    };

    const handleNameChange = (value) => {
        setTempName(value);
        setHasUnsavedChanges(true);
    };

    // ============ Password Handlers ============
    const handleSavePassword = async (e) => {
        e.preventDefault();
        setPassMsg({ type: "", content: "" });

        if (passForm.newPassword !== passForm.confirmPassword) {
            setPassMsg({ type: "error", content: "New passwords do not match." });
            return;
        }
        if (passForm.newPassword.length < 5) {
            setPassMsg({ type: "error", content: "Password must be at least 5 characters." });
            return;
        }

        setPassLoading(true);
        try {
            await userService.changePassword({
                currentPassword: passForm.currentPassword,
                newPassword: passForm.newPassword
            });
            setPassMsg({ type: "success", content: "Password changed successfully!" });
            setTimeout(() => {
                setShowPassModal(false);
                setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setPassMsg({ type: "", content: "" });
            }, 1500);
        } catch (err) {
            setPassMsg({ type: "error", content: err.response?.data?.message || "Failed to change password." });
        } finally {
            setPassLoading(false);
        }
    };

    const roleBadge = getRoleBadge();

    return (
        <>
            {/* Main Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 animate-fade-in transition-all">
                <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl shadow-slate-200/50 max-h-[85vh] flex flex-col overflow-hidden ring-1 ring-slate-100">
                    
                    {/* Header */}
                    <div className="bg-white px-8 pt-8 pb-4">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-5">
                                {/* Avatar - Compact & Symbolic */}
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#800020] to-[#b3002d] flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-rose-900/20 ring-4 ring-slate-50">
                                    {user?.avatar?.url ? (
                                        <img src={user.avatar.url} className="w-full h-full object-cover rounded-2xl" alt="Avatar" />
                                    ) : (
                                        user?.fullName?.charAt(0)
                                    )}
                                </div>
                                
                                {/* User Info - Horizontal Layout */}
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 leading-tight">{user?.fullName}</h2>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                        <p className="text-slate-500 font-medium text-sm">{user?.email}</p>
                                        <span className={`hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300`}></span>
                                        <span className={`self-start sm:self-auto px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md ${roleBadge.color}`}>
                                            {roleBadge.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button 
                                onClick={handleClose}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200 -mt-2 -mr-2"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1.5 bg-slate-100/70 rounded-2xl">
                            {['info', 'security'].map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2.5 text-sm font-semibold capitalize rounded-xl transition-all duration-300 ${
                                        activeTab === tab 
                                        ? 'bg-white text-[#800020] shadow-sm shadow-slate-200 ring-1 ring-black/5' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                                >
                                    {tab === 'info' ? 'Profile Details' : 'Security'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-white px-8 pb-8 pt-4 custom-scrollbar">
                        {activeTab === 'info' ? (
                            <div className="space-y-6 animate-slide-up">
                                {/* Full Name Section */}
                                <div className="group">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                                    </div>
                                    
                                    {isEditingName ? (
                                        <div className="relative flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                value={tempName}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                className="w-full pl-4 pr-24 py-3.5 text-slate-800 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl focus:ring-2 focus:ring-[#800020]/20 focus:bg-white transition-all font-medium"
                                                autoFocus
                                                placeholder="Enter your name"
                                            />
                                            <div className="absolute right-2 flex gap-1">
                                                <button 
                                                    onClick={handleSaveName}
                                                    disabled={updatingName}
                                                    className="w-8 h-8 flex items-center justify-center bg-[#800020] text-white rounded-xl hover:bg-[#600018] shadow-md hover:shadow-lg transition-all disabled:opacity-70 active:scale-95"
                                                >
                                                    {updatingName ? <i className="fa-solid fa-circle-notch fa-spin text-xs"></i> : <i className="fa-solid fa-check text-xs"></i>}
                                                </button>
                                                <button 
                                                    onClick={handleCancelEdit}
                                                    className="w-8 h-8 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 ring-1 ring-slate-200 transition-all active:scale-95"
                                                >
                                                    <i className="fa-solid fa-xmark text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={handleEditName}
                                            className="w-full flex items-center gap-4 px-5 py-4 bg-slate-50/50 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-2xl transition-all cursor-pointer group/item"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#800020] shadow-sm ring-1 ring-slate-100 group-hover/item:scale-110 transition-transform">
                                                <i className="fa-regular fa-user"></i>
                                            </div>
                                            <span className="text-base font-semibold text-slate-700 flex-1">{user?.fullName}</span>
                                            <i className="fa-solid fa-pen text-slate-300 group-hover/item:text-[#800020] transition-colors text-sm"></i>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
            
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                    <div className="rounded-xl px-5 py-4 bg-slate-50/50 hover:bg-slate-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600`}>
                                                    <i className="fa-regular fa-envelope"></i>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-bold text-gray-900">{user.email}</span>
                                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center" title="Verified">
                                                        <i className="fa-solid fa-check text-green-600 text-xs"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                                                <i className="fa-solid fa-lock text-sm"></i>
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 pt-2 animate-slide-up">
                                <button 
                                    onClick={() => setShowPassModal(true)}
                                    className="w-full bg-slate-50 hover:bg-white rounded-2xl p-5 border border-transparent hover:border-slate-100 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 group text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-[#800020] shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                <i className="fa-solid fa-lock-open"></i>
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-slate-800 group-hover:text-[#800020] transition-colors">Change Password</h4>
                                                <p className="text-sm text-slate-500 mt-0.5">Secure your account with a new password</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-slate-300 group-hover:text-[#800020] group-hover:translate-x-1 transition-all shadow-sm">
                                            <i className="fa-solid fa-arrow-right text-sm"></i>
                                        </div>
                                    </div>
                                </button>
                            
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showPassModal}
                onClose={() => setShowPassModal(false)}
                onSubmit={handleSavePassword}
                form={passForm}
                setForm={setPassForm}
                loading={passLoading}
                message={passMsg}
            />

            {/* Close Confirmation Modal */}
            {showCloseConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center animate-scale-up">
                        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4 text-amber-500 shadow-sm">
                            <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Unsaved Changes</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                            You have modified your profile information. <br/>Closing now will discard these changes.
                        </p>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowCloseConfirm(false)}
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
                            >
                                Keep Editing
                            </button>
                            <button 
                                onClick={confirmClose}
                                className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all font-bold text-sm"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}