const getTitleFromUrl = (url) => {
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.hostname;
    } catch {
        return url;
    }
};

// ============ ORDER HELPERS ============

export const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const diffMins = Math.floor((Date.now() - date) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

export const formatTime = (dateString) => {
    return dateString
        ? new Date(dateString).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
        : null;
};

export const calcDiffSeconds = (start, end) => {
    return start && end
        ? Math.round((new Date(end) - new Date(start)) / 1000)
        : null;
};

export const formatDuration = (seconds) => {
    if (!seconds) return "--";
    if (seconds < 60) return `${seconds}s`;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(seconds / 3600);

    if (seconds < 3600) {
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }

    const m = Math.floor((seconds % 3600) / 60);
    return `${hours}h${m ? ` ${m}m` : ""}${secs && !m ? ` ${secs}s` : ""}`;
};

export const formatMoney = (amount, currency = 'USD') => {
    if (amount === undefined || amount === null) return '0';

    if (currency === 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }

    // Mặc định VND
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

export const getTimeStyle = (seconds, type) => {
    if (!seconds) {
        return {
            color: "text-gray-400",
            bg: "bg-gray-50 border border-gray-200",
        };
    }

    const mins = seconds / 60;
    const thresholds = {
        wait: [2, 5],
        prep: [10, 20],
        serve: [3, 7],
    };
    const [good, warning] = thresholds[type] || [0, 0];

    const level = mins <= good ? "green" : mins <= warning ? "yellow" : "red";

    return {
        color: `text-${level}-600`,
        bg: `bg-${level}-50 border border-${level}-200`,
    };
};

// ============ ORDER CONSTANTS ============

export const STATUS_BADGES = {
    pending: {
        text: "Received",
        color: "bg-orange-100 text-orange-700",
        icon: "fa-clock",
    },
    accepted: {
        text: "Preparing",
        color: "bg-blue-100 text-blue-700",
        icon: "fa-fire",
    },
    preparing: {
        text: "Preparing",
        color: "bg-blue-100 text-blue-700",
        icon: "fa-fire",
    },
    ready: {
        text: "Ready",
        color: "bg-green-100 text-green-700",
        icon: "fa-check-circle",
    },
    completed: {
        text: "Completed",
        color: "bg-gray-100 text-gray-700",
        icon: "fa-check-double",
    },
    served: {
        text: "Completed",
        color: "bg-gray-100 text-gray-700",
        icon: "fa-check-double",
    },
    rejected: {
        text: "Rejected",
        color: "bg-red-100 text-red-700",
        icon: "fa-times-circle",
    },
};

export const STEP_COLORS = {
    created: {
        bg: "bg-orange-500",
        bgInactive: "bg-orange-100",
        textInactive: "text-orange-300",
    },
    accepted: {
        bg: "bg-blue-500",
        bgInactive: "bg-blue-100",
        textInactive: "text-blue-300",
    },
    ready: {
        bg: "bg-green-500",
        bgInactive: "bg-green-100",
        textInactive: "text-green-300",
    },
    served: {
        bg: "bg-gray-500",
        bgInactive: "bg-gray-100",
        textInactive: "text-gray-300",
    },
};

// ============ FILTER FUNCTIONS ============

export const filterByDate = (
    order,
    dateFilter,
    customDateStart,
    customDateEnd
) => {
    if (dateFilter === "all") return true;

    const orderDate = new Date(order.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === "today") {
        return orderDate >= today;
    }

    if (dateFilter === "yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return orderDate >= yesterday && orderDate < today;
    }

    if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate >= weekAgo;
    }

    if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return orderDate >= monthAgo;
    }

    if (dateFilter === "custom" && customDateStart && customDateEnd) {
        const start = new Date(customDateStart);
        const end = new Date(customDateEnd);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
    }

    return true;
};

export const filterOrders = (
    orders,
    searchText,
    selectedTable,
    dateFilter,
    customDateStart,
    customDateEnd
) => {
    return orders.filter((order) => {
        const matchSearch =
            searchText === "" ||
            order._id.toLowerCase().includes(searchText.toLowerCase()) ||
            order.sessionId?.tableId?.name
                ?.toLowerCase()
                .includes(searchText.toLowerCase());

        const matchTable =
            selectedTable === "all" ||
            order.sessionId?.tableId?.name === selectedTable;

        const matchDate = filterByDate(
            order,
            dateFilter,
            customDateStart,
            customDateEnd
        );

        return matchSearch && matchTable && matchDate;
    });
};

export const calculateTabCounts = (allOrders) => {
    return {
        all: allOrders.length,
        received: allOrders.filter((o) => o.status === "pending").length,
        preparing: allOrders.filter((o) =>
            ["accepted", "preparing"].includes(o.status)
        ).length,
        ready: allOrders.filter((o) => o.status === "ready").length,
        completed: allOrders.filter((o) =>
            ["completed", "served"].includes(o.status)
        ).length,
    };
};

export const getUniqueTables = (orders) => {
    return [
        ...new Set(orders.map((o) => o.sessionId?.tableId?.name).filter(Boolean)),
    ];
};

export const Helper = {
    getTitleFromUrl,
};
