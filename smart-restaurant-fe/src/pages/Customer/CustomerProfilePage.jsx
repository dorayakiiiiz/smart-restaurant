import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "../../services/orderService";
import { useNavigate } from "react-router-dom"; 

export default function CustomerProfilePage() {
    const { user, logout } = useAuth();
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

    return (
        <div className="max-w-2xl mx-auto px-4 pb-24 pt-6 font-sans antialiased text-slate-900">
            {/* 1. Elegant Profile Header */}
            <div className="relative overflow-hidden bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-8">
                {/* Background Decor */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#800020] to-[#b3002d] flex items-center justify-center text-2xl font-bold text-white shadow-lg hover:rotate-0 transition-transform duration-300">
                                {user?.fullName?.charAt(0)}
                            </div>
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
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden divide-y divide-gray-50">
                        <div className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                                <p className="text-sm font-bold text-gray-900">{user?.fullName}</p>
                            </div>
                            <i className="fa-solid fa-user text-gray-200"></i>
                        </div>
                        <div className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                                <p className="text-sm font-bold text-gray-900">{user?.email}</p>
                            </div>
                            <i className="fa-solid fa-envelope text-gray-200"></i>
                        </div>
                        <button className="group w-full p-6 text-left hover:bg-red-50/50 transition-all flex justify-between items-center">
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Security</p>
                                <p className="text-sm font-bold text-[#800020]">Update Password</p>
                            </div>
                            <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-[#800020] group-hover:translate-x-1 transition-all"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}