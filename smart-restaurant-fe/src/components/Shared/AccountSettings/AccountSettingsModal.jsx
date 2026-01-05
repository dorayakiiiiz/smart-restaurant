import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { userService } from "../../../services/userService";
import InfoField from "./InfoField";
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

    // ============ Utility Functions ============
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getRoleBadge = () => {
        const roleMap = {
            admin: { label: "Restaurant Admin", color: "bg-red-100 text-red-700 border-red-200" },
            waiter: { label: "Waiter", color: "bg-blue-100 text-blue-700 border-blue-200" },
            kitchen: { label: "Kitchen Staff", color: "bg-orange-100 text-orange-700 border-orange-200" }
        };
        return roleMap[user?.role] || { label: user?.role, color: "bg-gray-100 text-gray-700 border-gray-200" };
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                    
                    {/* Header */}
                    <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-tr from-[#800020] to-[#b3002d] flex items-center justify-center text-xl font-bold text-white shadow-md">
                                    {user?.avatar?.url ? (
                                        <img src={user.avatar.url} className="w-full h-full object-cover" alt="Avatar" />
                                    ) : (
                                        user?.fullName?.charAt(0)
                                    )}
                                </div>
                                
                                <div>
                                    <h2 className="text-2xl font-bold font-momo text-[#1a1a1a]">{user?.fullName}</h2>
                                    <p className="text-gray-500 text-base mt-0.5">{user?.email}</p>
                                    <span className={`inline-block mt-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${roleBadge.color}`}>
                                        {roleBadge.label}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-gray-400 hover:text-gray-600"></i>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                            {['info', 'security'].map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2.5 text-sm font-bold capitalize rounded-md transition-all ${
                                        activeTab === tab 
                                        ? 'bg-white text-[#800020] shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {tab === 'info' ? 'Personal Information' : 'Security'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                        {activeTab === 'info' ? (
                            <div className="space-y-4">
                                {/* Full Name Section */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                    {isEditingName ? (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                value={tempName}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                className="flex-1 px-4 py-3 text-base font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all"
                                                autoFocus
                                                placeholder="Enter your name"
                                            />
                                            <button 
                                                onClick={handleSaveName}
                                                disabled={updatingName}
                                                className="w-10 h-10 flex items-center justify-center bg-[#800020] text-white rounded-xl hover:bg-[#600018] transition-all disabled:opacity-50"
                                            >
                                                {updatingName ? <i className="fa-solid fa-circle-notch fa-spin text-sm"></i> : <i className="fa-solid fa-check text-sm"></i>}
                                            </button>
                                            <button 
                                                onClick={handleCancelEdit}
                                                className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all"
                                            >
                                                <i className="fa-solid fa-xmark text-sm"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <i className="fa-regular fa-user"></i>
                                                </div>
                                                <span className="text-base font-bold text-gray-900">{user?.fullName}</span>
                                            </div>
                                            <button 
                                                onClick={handleEditName}
                                                className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <i className="fa-solid fa-pen-to-square text-sm"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <InfoField
                                    label="Email Address"
                                    value={user?.email}
                                    icon="fa-regular fa-envelope"
                                    iconBg="bg-purple-100"
                                    iconColor="text-purple-600"
                                    locked
                                    verified
                                />

                                <InfoField
                                    label="Role"
                                    icon="fa-solid fa-user-tie"
                                    iconBg="bg-amber-100"
                                    iconColor="text-amber-600"
                                    locked
                                    badge={
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${roleBadge.color}`}>
                                            {roleBadge.label}
                                        </span>
                                    }
                                />

                                {user?.restaurant && (
                                    <InfoField
                                        label="Restaurant"
                                        value={user.restaurant.name}
                                        icon="fa-solid fa-utensils"
                                        iconBg="bg-rose-100"
                                        iconColor="text-rose-600"
                                        locked
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <button 
                                    onClick={() => setShowPassModal(true)}
                                    className="w-full bg-white rounded-xl p-5 border border-gray-200 hover:border-[#800020] hover:shadow-sm transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                                                <i className="fa-solid fa-key"></i>
                                            </div>
                                            <div className="text-left">
                                                <h4 className="text-base font-bold text-gray-900">Change Password</h4>
                                                <p className="text-sm text-gray-500 mt-0.5">Update your password regularly</p>
                                            </div>
                                        </div>
                                        <i className="fa-solid fa-chevron-right text-gray-400 text-sm group-hover:text-[#800020] group-hover:translate-x-1 transition-all"></i>
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fade-in">
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <i className="fa-solid fa-triangle-exclamation text-amber-500 text-2xl"></i>
                                <h3 className="text-xl font-bold text-gray-900">Unsaved Changes</h3>
                            </div>
                            <p className="text-gray-600 text-sm">You have unsaved changes. Are you sure you want to close?</p>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowCloseConfirm(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-bold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmClose}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold"
                            >
                                Close Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
