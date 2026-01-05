import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "../../services/orderService";
import { userService } from "../../services/userService"; // Import service
import { useNavigate } from "react-router-dom"; 

export default function CustomerProfilePage() {
    const { user, logout, setUser } = useAuth(); // Lấy thêm setUser để update UI ngay lập tức
    const [activeTab, setActiveTab] = useState("history");

    const { data: historyData, isLoading, refetch } = useQuery({
        queryKey: ['customer-history'],
        queryFn: orderService.getCustomerHistory,
        enabled: !!user
    });

    const navigate = useNavigate(); 
    const handleLogout = () => {
        logout(); // Xóa token trong context/localStorage
        navigate('/auth/login'); // Chuyển hướng về trang login khách hàng
    };

    const sessions = historyData?.orders || [];

    const formatDate = (dateString) => {
        if (!dateString) return "Date N/A";
        const date = new Date(dateString);
        // Kiểm tra nếu date không hợp lệ
        if (isNaN(date.getTime())) return "Date N/A";
        
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(user?.fullName || "");
    const [updatingName, setUpdatingName] = useState(false);
    
    const fileInputRef = useRef(null);
    const [updatingAvatar, setUpdatingAvatar] = useState(false);
    
    // Hàm kích hoạt input file khi click vào avatar (gắn vào thẻ div/img avatar hiện tại)
    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    // Hàm xử lý khi chọn file
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate
        if (!file.type.startsWith('image/')) {
            alert("Please select an image file.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB.");
            return;
        }

        try {
            setUpdatingAvatar(true);
            
            const formData = new FormData();
            formData.append('avatar', file); 

            const res = await userService.updateAccountInfo(formData);
            
            setUser(res.user);
            
        } catch (error) {
            console.error("Upload failed:", error);
            alert(error.response?.data?.message || "Failed to upload avatar.");
        } finally {
            setUpdatingAvatar(false);
            // Reset input để có thể upload lại cùng file
            e.target.value = '';
        }
    };

    const [showPassModal, setShowPassModal] = useState(false);
    const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg] = useState({ type: "", content: "" });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Handler update Name
    const handleSaveName = async () => {
        if (!tempName.trim()) return;
        setUpdatingName(true);
        try {
            const res = await userService.updateAccountInfo({ fullName: tempName });
            // Cập nhật context user
            setUser({ ...user, fullName: res.user.fullName });
            setIsEditingName(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update name");
        } finally {
            setUpdatingName(false);
        }
    };

    // Handler update Password
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

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await userService.deleteAccount();
            logout();
            navigate('/auth/login'); 
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete account");
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };
    // ----------------------------------

    return (
        <div className="max-w-2xl mx-auto px-4 pb-24 pt-6 font-sans antialiased text-slate-900">
            {/* 1. Elegant Profile Header */}
            <div className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-8">
                {/* Background Decor */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div 
                                className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#800020] to-[#b3002d] flex items-center justify-center text-2xl font-bold text-white shadow-lg transition-transform duration-300 cursor-pointer"
                                onClick={handleAvatarClick}
                            >
                                {updatingAvatar ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                ) : user?.avatar?.url ? (
                                    <img src={user.avatar.url} className="w-full h-full object-cover" />
                                ) : (
                                    user?.fullName?.charAt(0)
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/*"
                            />

                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">{user?.fullName}</h2>
                            <p className="text-gray-400 text-sm font-medium">{user?.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[11px] font-bold uppercase tracking-wider rounded-full border border-amber-100 flex items-center gap-1.5">
                                    <i className="fa-solid fa-crown text-[9px]"></i> Elite Member
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout} 
                        className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-300"
                    >
                        <i className="fa-solid fa-right-from-bracket group-hover:scale-110 transition-transform"></i>
                    </button>
                </div>
            </div>

            {/* 2. Glassmorphism Tabs */}
            <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-md rounded-2xl mb-8">
                {['history', 'info'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-bold capitalize rounded-xl transition-all duration-300 ${
                            activeTab === tab 
                            ? 'bg-white text-[#800020] shadow-md ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab === 'history' ? 'Order History' : 'Personal Details'}
                    </button>
                ))}
            </div>

            {/* 3. Dynamic Content Area */}
            <div className="space-y-6">
                {activeTab === 'history' ? (
                    <div className="space-y-5">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-10 h-10 border-4 border-gray-100 border-t-[#800020] rounded-full animate-spin"></div>
                                <p className="text-gray-400 font-medium animate-pulse">Fetching your orders...</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                                    <i className="fa-solid fa-receipt text-3xl"></i>
                                </div>
                                <h3 className="text-gray-900 font-bold">No orders yet</h3>
                                <p className="text-gray-400 text-sm mt-1">When you order, they'll appear here.</p>
                                <button onClick={() => refetch()} className="mt-6 px-6 py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">
                                    Refresh List
                                </button>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div key={session.sessionId} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                                    {/* Session Header (Tổng hóa đơn) */}
                                    <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-gray-100">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Session Date</div>
                                            <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                <i className="fa-regular fa-calendar"></i> {formatDate(session.date)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-[#800020] text-lg">
                                                ${(session.totalAmount || 0).toLocaleString()}
                                            </div>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                                                session.paymentStatus === 'paid' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {session.paymentStatus || 'Unpaid'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Orders List (Chi tiết từng lần gọi) */}
                                    <div className="p-4 space-y-5">
                                        {/* Kiểm tra an toàn trước khi map */}
                                        {session.ordersList && session.ordersList.length > 0 ? (
                                            session.ordersList.map((order, idx) => (
                                                <div key={order._id || idx} className="relative pl-4 border-l-2 border-gray-200">
                                                    {/* Timeline Dot */}
                                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white"></div>
                                                    
                                                    {/* Order Header */}
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-gray-600">
                                                            Round {idx + 1} <span className="font-normal text-gray-400 ml-1">• {formatTime(order.createdAt)}</span>
                                                        </span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase border ${
                                                            order.status === 'served' ? 'border-green-200 text-green-600 bg-green-50' : 'border-gray-200 text-gray-500'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>

                                                    {/* Items in this order */}
                                                    <div className="space-y-2 bg-gray-50/50 p-2 rounded-lg">
                                                        {order.items && order.items.map((item, itemIdx) => (
                                                            <div key={itemIdx} className="flex justify-between text-sm">
                                                                <div className="flex gap-2 items-start">
                                                                    <span className="font-bold text-gray-800 w-5 shrink-0 text-right">{item.quantity}x</span>
                                                                    <span className="text-gray-700">{item.name}</span>
                                                                </div>
                                                                <span className="text-gray-500 font-medium text-xs shrink-0 ml-2">
                                                                    ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-xs text-gray-400 italic">No items details available</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-5 animate-fade-in-up">
                        {/* PERSONAL INFORMATION */}
                        <div className="bg-white rounded-2xl px-6 py-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">

                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2 relative z-10">
                                Personal Information
                            </h3>

                            <div className="space-y-6 relative z-10">
                                {/* Full Name Field */}
                                <div className="group">
                                    <label className="block text-sm font-quicksand font-bold text-gray-700 mb-2">Full Name</label>
                                    
                                    {isEditingName ? (
                                        <div className="font-quicksand flex items-center gap-2 animate-fade-in">
                                            <div className="relative flex-1">

                                                <div className="w-8 h-8 absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-gray-500 bg-white shadow-xs">
                                                    <i className="fa-regular fa-user"></i>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={tempName}
                                                    onChange={(e) => setTempName(e.target.value)}
                                                    className="w-full text-sm pl-14 pr-4 py-3 font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] transition-all"
                                                    autoFocus
                                                    placeholder="Enter your name"
                                                />
                                            </div>
                                            <button 
                                                onClick={handleSaveName}
                                                disabled={updatingName}
                                                className="w-11 h-11 flex items-center justify-center bg-[#800020] text-white rounded-xl hover:bg-[#600018] shadow-lg shadow-red-900/20 transition-all active:scale-95 disabled:opacity-70"
                                            >
                                                {updatingName ? <i className="fa-solid fa-circle-notch fa-spin text-xs"></i> : <i className="fa-solid fa-check"></i>}
                                            </button>
                                            <button 
                                                onClick={() => { setIsEditingName(false); setTempName(user?.fullName); }}
                                                className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-95"
                                            >
                                                <i className="fa-solid fa-xmark"></i>
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 bg-white shadow-xs">
                                                    <i className="fa-regular fa-user"></i>
                                                </div>
                                                <span className="text-sm font-bold text-gray-800 font-quicksand">{user?.fullName}</span>
                                            </div>
                                            <div 
                                                className="w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700" title="Edit"
                                                onClick={() => { setIsEditingName(true); setTempName(user?.fullName); }}
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Email Field (Read Only) */}
                                <div>
                                    <label className="block text-sm font-quicksand font-bold text-gray-700 mb-2">Email Address</label>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                <i className="fa-regular fa-envelope"></i>
                                            </div>
                                            <span className="text-sm font-bold font-quicksand text-gray-800">{user?.email}</span>
                                            <div className="text-[9px] text-green-700 bg-green-200 rounded-full flex items-center justify-center w-5 h-5" title="Verified">
                                                <i className="fa-solid fa-check"></i>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 flex items-center justify-center text-gray-400" title="Cannot change email">
                                            <i className="fa-solid fa-lock text-xs"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2: SECURITY & DANGER ZONE */}
                        <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                Account Security
                            </h3>
                            
                            <div className="space-y-3 font-quicksand">
                                {/* Change Password */}
                                <button 
                                    onClick={() => setShowPassModal(true)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 transition-all group border border-gray-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white text-gray-700 flex items-center justify-center text-lg shadow-xs">
                                            <i className="fa-solid fa-key"></i>
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-sm font-bold text-gray-900">Change Password</h4>
                                            <p className="text-xs text-gray-500 mt-0.5 font-medium">Update your password regularly</p>
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                                </button>

                                {/* Delete Account */}
                                <button 
                                    onClick={() => setShowDeleteModal(true)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50/50 transition-all group border border-red-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center text-lg shadow-xs">
                                            <i className="fa-solid fa-trash-can"></i>
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-sm font-bold text-red-700">Delete Account</h4>
                                            <p className="text-xs text-red-400 mt-0.5 font-medium">Permanently remove your account</p>
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-red-300 text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CHANGE PASSWORD MODAL */}
            {showPassModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
                            <button onClick={() => setShowPassModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>

                        {passMsg.content && (
                            <div className={`mb-2 p-3 ${passMsg.type === 'success' ? 'bg-green-50 border border-green-100 text-green-600' : 'bg-red-50 border border-red-100 text-red-600'} text-sm rounded-xl flex items-center gap-2`}>
                                <i className="fa-solid fa-circle-check"></i>
                                {passMsg.content}
                            </div>
                        )}

                        <form onSubmit={handleSavePassword} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm mb-1 font-quicksand font-semibold">Current Password</label>
                                <input 
                                    type="password"
                                    required
                                    value={passForm.currentPassword}
                                    onChange={e => { setPassForm({...passForm, currentPassword: e.target.value}); setPassMsg({ type: "", content: "" }) }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block font-quicksand text-gray-700 text-sm mb-1 font-semibold">New Password</label>
                                <input 
                                    type="password"
                                    required
                                    value={passForm.newPassword}
                                    onChange={e => { setPassForm({...passForm, newPassword: e.target.value}); setPassMsg({ type: "", content: "" }) }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block font-quicksand font-semibold text-gray-700 text-sm mb-1">Confirm New Password</label>
                                <input 
                                    type="password"
                                    required
                                    value={passForm.confirmPassword}
                                    onChange={e => { setPassForm({...passForm, confirmPassword: e.target.value}); setPassMsg({ type: "", content: "" }) }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>


                            <button 
                                type="submit" 
                                disabled={passLoading}
                                className="w-full py-3.5 bg-[#800020] text-white font-bold rounded-xl hover:bg-[#600018] transition-all disabled:opacity-70 flex justify-center items-center gap-2 mt-10"
                            >
                                {passLoading && <i className="fa-solid fa-circle-notch fa-spin"></i>}
                                Change Password
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE ACCOUNT MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fade-in">
                        <div className="mb-10">
                            <div className="flex items-center text-2xl">
                                <i className="fa-solid fa-triangle-exclamation text-red-500/90"></i>
                                <div className="font-bold font-momo text-red-500 ml-3">Delete Account</div>
                            </div>
                            <p className="text-gray-700 mt-2 font-quicksand font-bold">Are you sure you want to delete your account? This action is irreversible.</p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowDeleteModal(false)} 
                                className="font-quicksand flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-bold"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="font-quicksand font-bold flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                            >
                                {isDeleting && <i className="fa-solid fa-circle-notch fa-spin"></i>}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}