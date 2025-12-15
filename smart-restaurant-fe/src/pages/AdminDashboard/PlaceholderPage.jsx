import React from 'react';

const PlaceholderPage = ({ title, icon, desc }) => (
    <div className="w-full h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center p-10">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl text-gray-400 mb-6">
            <i className={`fa-solid ${icon}`}></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-500 max-w-md">{desc || "This feature is currently under development. Please check back later."}</p>
    </div>
);

export const TablesPage = () => <PlaceholderPage title="Table Management" icon="fa-chair" desc="Create tables, generate QR codes, and manage seating arrangements." />;
export const MenuPage = () => <PlaceholderPage title="Menu Management" icon="fa-chair" desc="Create menu for restaurant." />;
export const OrdersPage = () => <PlaceholderPage title="Live Orders" icon="fa-bell-concierge" desc="Real-time view of incoming orders from customers." />;
export const KDSPage = () => <PlaceholderPage title="Kitchen Display System" icon="fa-fire-burner" desc="Digital screen for kitchen staff to manage food preparation." />;
export const StaffPage = () => <PlaceholderPage title="Staff Management" icon="fa-users-gear" desc="Manage waiter and kitchen staff accounts and permissions." />;
export const ReportsPage = () => <PlaceholderPage title="Reports & Analytics" icon="fa-chart-line" desc="View revenue, popular items, and performance metrics." />;