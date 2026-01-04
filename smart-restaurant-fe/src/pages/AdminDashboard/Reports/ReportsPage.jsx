import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportService } from "../../../services/reportService";
import FilterModal from "./components/FilterModal";
import SummaryStats from "./components/SummaryStats";
import PeakHoursChart from "./components/PeakHoursChart";
import TopSellingItemsTable from "./components/TopSellingItemsTable";
import RevenueOverTimeChart from "./components/RevenueOverTimeChart";

// ============ HELPER FUNCTIONS ============
const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0.00';
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatTime = (seconds) => {
    if (!seconds) return '0 min';
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
};

const getPeriodLabel = (period) => {
    const labels = {
        today: 'Today',
        yesterday: 'Yesterday',
        week: 'Last 7 Days',
        month: 'Last 30 Days',
        custom: 'Custom Range'
    };
    return labels[period] || 'Last 7 Days';
};

const getComparisonText = (period) => {
    const texts = {
        today: 'vs Yesterday',
        yesterday: 'vs Day Before',
        week: 'vs Previous 7 Days',
        month: 'vs Previous 30 Days',
        custom: 'vs Previous Period'
    };
    return texts[period] || 'vs Previous Period';
};

const renderTrend = (trend, period) => {
    if (!trend) return null;
    
    const { value, direction, isPositive } = trend;
    const colorClass = isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    const icon = direction === 'up' ? '↑' : '↓';
    
    return (
        <div className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit mt-1 ${colorClass}`}>
            {icon} {value}% {getComparisonText(period)}
        </div>
    );
};

const getAutoGroupBy = (period, customDateStart, customDateEnd) => {
    if (period === 'today' || period === 'yesterday' || period === 'week') {
        return 'daily';
    } else if (period === 'month') {
        return 'weekly';
    } else if (period === 'custom') {
        if (customDateStart && customDateEnd) {
            const start = new Date(customDateStart);
            const end = new Date(customDateEnd);
            const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 14) return 'daily';
            else if (diffDays <= 60) return 'weekly';
            else return 'monthly';
        }
        return 'daily';
    }
    return 'daily';
};

// ============ EXPORT HANDLERS ============
const handleExportPDF = async (period, customDateStart, customDateEnd) => {
    try {
        const res = await reportService.exportPDF(
            period,
            period === 'custom' ? customDateStart : null,
            period === 'custom' ? customDateEnd : null
        );
        
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sales_Report_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export PDF error:', error);
        alert('Failed to export PDF. Please try again.');
    }
};

const handleExportCSV = async (period, customDateStart, customDateEnd) => {
    try {
        const res = await reportService.exportCSV(
            period,
            period === 'custom' ? customDateStart : null,
            period === 'custom' ? customDateEnd : null
        );
        
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sales_Report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export CSV error:', error);
        alert('Failed to export CSV. Please try again.');
    }
};

// ============ SUB-COMPONENTS ============
const HeaderSection = ({ period, onFilterClick, onExportPDF, onExportCSV, isLoading, hasData }) => (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800">Reports & Analytics</h2>
            <p className="text-gray-500 text-sm">Track your restaurant's performance</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={onFilterClick}
                className="h-[50px] px-6 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors font-bold text-gray-700 flex items-center gap-2"
            >
                <i className="fa-solid fa-filter"></i>
                Filter: {getPeriodLabel(period)}
                {period !== "week" && <span className="ml-1 w-2 h-2 bg-[#D4AF37] rounded-full"></span>}
            </button>

            <button 
                onClick={onExportPDF}
                disabled={isLoading || !hasData}
                className="h-[50px] px-5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
            >
                <i className="fa-solid fa-file-pdf"></i>
                PDF
            </button>

            <button 
                onClick={onExportCSV}
                disabled={isLoading || !hasData}
                className="h-[50px] px-5 rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
            >
                <i className="fa-solid fa-file-csv"></i>
                CSV
            </button>
        </div>
    </div>
);

const EmptyState = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-chart-line text-3xl text-gray-400"></i>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No Data Available</h3>
        <p className="text-gray-500">
            No orders found for the selected period. Try selecting a different date range.
        </p>
    </div>
);

const ChartsSection = ({ revenueData, revenueLoading, peakHoursData, peakHoursLoading, period, groupBy, customDateStart, customDateEnd }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
            <RevenueOverTimeChart 
                data={revenueData?.data}
                isLoading={revenueLoading}
                period={period}
                groupBy={groupBy}
            />
        </div>

        <PeakHoursChart 
            data={peakHoursData?.data} 
            isLoading={peakHoursLoading}
            period={period}
            customDateStart={customDateStart}
            customDateEnd={customDateEnd}
            getPeriodLabel={() => getPeriodLabel(period)}
        />
    </div>
);

// ============ MAIN COMPONENT ============
export default function ReportsPage() {
    const [period, setPeriod] = useState("week");
    const [customDateStart, setCustomDateStart] = useState("");
    const [customDateEnd, setCustomDateEnd] = useState("");
    const [showFilterModal, setShowFilterModal] = useState(false);

    const groupBy = useMemo(() => 
        getAutoGroupBy(period, customDateStart, customDateEnd),
        [period, customDateStart, customDateEnd]
    );

    // Fetch Summary Stats
    const { data: summaryData, isLoading, error } = useQuery({
        queryKey: ['reports-summary', period, customDateStart, customDateEnd],
        queryFn: async () => {
            const res = await reportService.getSummary(
                period,
                period === 'custom' ? customDateStart : null,
                period === 'custom' ? customDateEnd : null
            );
            return res.data;
        },
        refetchOnWindowFocus: true
    });

    const hasData = summaryData && summaryData.summary.totalOrders > 0;

    // Fetch Peak Hours
    const { data: peakHoursData, isLoading: peakHoursLoading } = useQuery({
        queryKey: ['reports-peak-hours', period, customDateStart, customDateEnd],
        queryFn: async () => {
            const res = await reportService.getPeakHours(
                period,
                period === 'custom' ? customDateStart : null,
                period === 'custom' ? customDateEnd : null
            );
            return res.data;
        },
        enabled: hasData,
        refetchOnWindowFocus: true
    });

    // Fetch Top Items
    const { data: topItemsData, isLoading: topItemsLoading } = useQuery({
        queryKey: ['reports-top-items', period, customDateStart, customDateEnd],
        queryFn: async () => {
            const res = await reportService.getTopItems(
                period,
                10,
                period === 'custom' ? customDateStart : null,
                period === 'custom' ? customDateEnd : null
            );
            return res.data;
        },
        enabled: hasData,
        refetchOnWindowFocus: true
    });

    // Fetch Revenue Over Time
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['reports-revenue', period, groupBy, customDateStart, customDateEnd],
        queryFn: async () => {
            const res = await reportService.getRevenueOverTime(
                period,
                groupBy,
                period === 'custom' ? customDateStart : null,
                period === 'custom' ? customDateEnd : null
            );
            return res.data;
        },
        enabled: hasData,
        refetchOnWindowFocus: true
    });

    // Stats configuration
    const stats = [
        {
            title: "Total Revenue",
            value: summaryData?.summary?.totalRevenue,
            formatter: formatCurrency,
            icon: "fa-sack-dollar",
            color: "bg-green-500",
            trend: summaryData?.trends?.revenue,
            renderTrend: (trend) => renderTrend(trend, period)
        },
        {
            title: "Total Orders",
            value: summaryData?.summary?.totalOrders,
            formatter: (val) => val || 0,
            icon: "fa-receipt",
            color: "bg-blue-500",
            trend: summaryData?.trends?.orders,
            renderTrend: (trend) => renderTrend(trend, period)
        },
        {
            title: "Avg Order Value",
            value: summaryData?.summary?.avgOrderValue,
            formatter: formatCurrency,
            icon: "fa-chart-line",
            color: "bg-purple-500",
            trend: summaryData?.trends?.avgOrderValue,
            renderTrend: (trend) => renderTrend(trend, period)
        },
        {
            title: "Avg Prep Time",
            value: summaryData?.summary?.avgPrepTime,
            formatter: formatTime,
            icon: "fa-clock",
            color: "bg-orange-500",
            trend: summaryData?.trends?.avgPrepTime,
            renderTrend: (trend) => renderTrend(trend, period)
        }
    ];

    const resetFilters = () => {
        setPeriod("week");
        setCustomDateStart("");
        setCustomDateEnd("");
    };

    const applyFilters = () => {
        setShowFilterModal(false);
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            <HeaderSection 
                period={period}
                onFilterClick={() => setShowFilterModal(true)}
                onExportPDF={() => handleExportPDF(period, customDateStart, customDateEnd)}
                onExportCSV={() => handleExportCSV(period, customDateStart, customDateEnd)}
                isLoading={isLoading}
                hasData={hasData}
            />

            <FilterModal 
                show={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                period={period}
                setPeriod={setPeriod}
                customDateStart={customDateStart}
                setCustomDateStart={setCustomDateStart}
                customDateEnd={customDateEnd}
                setCustomDateEnd={setCustomDateEnd}
                onApply={applyFilters}
                onReset={resetFilters}
            />

            <SummaryStats 
                stats={stats}
                isLoading={isLoading}
                error={error}
            />

            {!isLoading && !error && !hasData && <EmptyState />}

            {!isLoading && !error && hasData && (
                <>
                    <ChartsSection 
                        revenueData={revenueData}
                        revenueLoading={revenueLoading}
                        peakHoursData={peakHoursData}
                        peakHoursLoading={peakHoursLoading}
                        period={period}
                        groupBy={groupBy}
                        customDateStart={customDateStart}
                        customDateEnd={customDateEnd}
                    />

                    <TopSellingItemsTable 
                        data={topItemsData?.data}
                        isLoading={topItemsLoading}
                        period={period}
                        customDateStart={customDateStart}
                        customDateEnd={customDateEnd}
                        getPeriodLabel={() => getPeriodLabel(period)}
                        formatCurrency={formatCurrency}
                        renderTrend={(trend) => renderTrend(trend, period)}
                    />
                </>
            )}
        </div>
    );
}
