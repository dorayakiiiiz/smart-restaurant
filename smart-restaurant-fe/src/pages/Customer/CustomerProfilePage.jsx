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
                                    <div className="relative w-20 h-20 overflow-hidden group cursor-pointer">
                                        <img 
                                            src={user.avatar.url} 
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <i className="fa-solid fa-camera text-white/70 text-sm"></i>
                                        </div>
                                    </div>
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
                            {/* <div className="flex gap-2 mt-2">
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[11px] font-bold uppercase tracking-wider rounded-full border border-amber-100 flex items-center gap-1.5">
                                    <i className="fa-solid fa-crown text-[9px]"></i> Elite Member
                                </span>
                            </div> */}
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
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-6">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-gray-100 border-t-[#800020] rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-[#800020]/30 rounded-full animate-reverse-spin"></div>
                                </div>
                                <div className="text-center">
                                    <p className="text-gray-500 font-semibold tracking-wide animate-pulse">Fetching your orders...</p>
                                    <p className="text-gray-400 text-xs mt-1">Just a moment while we prepare your history</p>
                                </div>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200 ring-8 ring-gray-50/50">
                                    <i className="fa-solid fa-receipt text-4xl"></i>
                                </div>
                                <h3 className="text-gray-900 text-xl font-bold">No orders yet</h3>
                                <p className="text-gray-400 text-sm mt-2 max-w-[200px] mx-auto">When you start ordering, your delicious history will appear here.</p>
                                <button 
                                    onClick={() => refetch()} 
                                    className="mt-8 px-8 py-3 bg-gray-900 text-white text-sm font-bold rounded-2xl hover:bg-black hover:shadow-lg active:scale-95 transition-all"
                                >
                                    Refresh List
                                </button>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                    <div key={session.sessionId} className="group border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 bg-white">
                                        {/* Session Header */}
                                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-3 px-5 flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20">
                                                    <i className="fa-regular fa-calendar-check text-lg"></i>
                                                </div>
                                                <div>
                                                    <div className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
                                                        Session Date
                                                    </div>
                                                    <div className="font-semibold text-white text-base">
                                                        {formatDate(session.date)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-white text-xl tracking-tight">
                                                    ${(session.totalAmount || 0).toLocaleString()}
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase mt-2 shadow-sm ${
                                                    session.paymentStatus === 'paid' 
                                                        ? 'bg-emerald-500 text-white' 
                                                        : 'bg-amber-500 text-white'
                                                }`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                    {session.paymentStatus || 'Unpaid'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Orders List */}
                                        <div className="pt-4 pb-6 px-6 space-y-8">
                                            {session.ordersList && session.ordersList.length > 0 ? (
                                                session.ordersList.map((order, idx) => (
                                                    <div key={order._id || idx} className="relative pl-8 border-l-2 border-slate-100 last:mb-0">
                                                        {/* Timeline Dot - Điểm nhấn xanh Indigo */}
                                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"></div>
                                                        
                                                        {/* Order Header */}
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-bold text-slate-800">Round {idx + 1}</span>
                                                                <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                                    {formatTime(order.createdAt)}
                                                                </span>
                                                            </div>
                                                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg ${
                                                                order.status === 'served' 
                                                                    ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' 
                                                                    : 'text-slate-500 bg-slate-50 border border-slate-200'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>

                                                        {/* Items Card - Background màu trắng xanh rất nhẹ */}
                                                        <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                                                            {order.items && order.items.map((item, itemIdx) => (
                                                                <div key={itemIdx} className="flex justify-between items-center group/item text-sm">
                                                                    <div className="flex gap-4 items-center">
                                                                        <span className="font-bold text-indigo-600 bg-indigo-50 w-8 h-8 flex items-center justify-center rounded-lg text-xs border border-indigo-100">
                                                                            {item.quantity}x
                                                                        </span>
                                                                        <span className="text-slate-700 font-medium group-hover/item:text-indigo-900 transition-colors">
                                                                            {item.name}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-slate-500 font-bold text-xs tabular-nums group-hover/item:text-slate-800">
                                                                        ${((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8 bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-100">
                                                    <p className="text-sm text-slate-400 font-medium italic">No items details available</p>
                                                </div>
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