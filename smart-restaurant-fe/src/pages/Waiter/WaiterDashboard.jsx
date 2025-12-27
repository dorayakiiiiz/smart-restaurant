import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { socket } from "../../services/socket";

export default function WaiterDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [reloadTrigger, setReloadTrigger] = useState(0);

    useEffect(() => {
        // Redirect to pending tab by default
        if (location.pathname === '/waiter/dashboard') {
            navigate('/waiter/dashboard/pending', { replace: true });
        }
    }, [location.pathname, navigate]);

    // Socket setup
    useEffect(() => {
        if (!user) {
            console.warn('⚠️ User object is null/undefined');
            return;
        }

        console.log('=== USER CHECK ===');
        console.log('Full user object:', JSON.stringify(user, null, 2));
        console.log('user.restaurantId:', user.restaurantId);
        console.log('user.role:', user.role);
        console.log('user.email:', user.email);
        
        if (!user.restaurantId) {
            console.error('❌ CRITICAL: User has no restaurantId!');
            console.error('This waiter account needs to be assigned to a restaurant.');
            console.error('Please contact admin to assign restaurantId to this user.');
            return;
        }

        // Connect socket
        if (!socket.connected) {
            socket.connect();
        }

        // Join waiter room
        const roomName = `restaurant_${user.restaurantId}_waiter`;
        socket.emit('join_waiter', user.restaurantId);
        console.log('=== WAITER SOCKET ===');
        console.log('User restaurantId:', user.restaurantId);
        console.log('Joining room:', roomName);
        console.log('Socket ID:', socket.id);

        // Listen to events
        const handleReload = (eventName) => {
            console.log(`${eventName} event received`);
            setReloadTrigger(prev => prev + 1);
        };

        socket.on('new_order_alert', () => handleReload('new_order_alert'));
        socket.on('order_accepted', () => handleReload('order_accepted'));
        socket.on('order_rejected', () => handleReload('order_rejected'));
        socket.on('order_served', () => handleReload('order_served'));
        socket.on('order_update', () => handleReload('order_update'));
        socket.on('item_status_updated', () => handleReload('item_status_updated'));
        socket.on('payment_request', () => handleReload('payment_request'));
        socket.on('payment_completed', () => handleReload('payment_completed'));

        // Cleanup
        return () => {
            socket.off('new_order_alert');
            socket.off('order_accepted');
            socket.off('order_rejected');
            socket.off('order_served');
            socket.off('order_update');
            socket.off('item_status_updated');
            socket.off('payment_request');
            socket.off('payment_completed');
        };
    }, [user?.restaurantId]);

    const tabs = [
        { path: 'pending', label: 'Pending' },
        { path: 'accepted', label: 'Accepted' },
        { path: 'ready', label: 'Ready' },
        { path: 'tables', label: 'Tables' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Mobile-first container - max-width 480px centered */}
            <div className="max-w-[480px] mx-auto bg-white min-h-screen shadow-2xl">
                {/* Header - Admin Style */}
                <div className="bg-[#1a1a1a] p-4 shadow-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-utensils text-yellow-700 text-xl"></i>
                            <div>
                                <h1 className="text-[#D4AF37] font-momo text-lg font-bold leading-tight">Smart Restaurant</h1>
                                <span className="text-[9px] tracking-wider text-white font-bold border border-gray-600 px-2 py-0.5 rounded uppercase bg-gray-800 inline-block mt-0.5">
                                    Waiter Panel
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-[#1a1a1a] flex items-center justify-center font-bold text-sm shadow-lg">
                                    {user?.fullName?.charAt(0) || 'W'}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1a1a1a]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs - Enhanced */}
                <div className="flex bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                    {tabs.map(tab => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `flex-1 px-3 py-3.5 text-center text-xs font-bold transition-all relative ${
                                    isActive
                                        ? 'text-[#D4AF37] bg-gray-50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {tab.label}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] shadow-lg"></div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                {/* Content */}
                <div className="p-4 bg-gradient-to-b from-gray-50 to-white min-h-screen">
                    <Outlet context={{ reloadTrigger }} />
                </div>
            </div>
        </div>
    );
}