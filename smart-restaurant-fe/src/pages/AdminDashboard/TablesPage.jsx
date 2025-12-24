import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tableService } from "../../services/tableService";
import Button from "../../components/Shared/Button";
import TableModal from "../../components/Modal/TableModal";
import QRModal from "../../components/Modal/QRModal";
import DeleteModal from "../../components/Modal/DeleteModal";

export default function TablesPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [qrTable, setQrTable] = useState(null); // Bàn đang xem QR
    const [deleteId, setDeleteId] = useState(null);
    const [filter, setFilter] = useState("all"); // all, free, occupied

    // Fetch Tables
    const { data, isLoading } = useQuery({
        queryKey: ['tables'],
        queryFn: tableService.getTables
    });

    const tables = data?.tables || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: tableService.createTable,
        onSuccess: () => queryClient.invalidateQueries(['tables'])
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => tableService.updateTable(id, data),
        onSuccess: () => queryClient.invalidateQueries(['tables'])
    });

    const deleteMutation = useMutation({
        mutationFn: tableService.deleteTable,
        onSuccess: () => queryClient.invalidateQueries(['tables'])
    });

    // Toggle Active/Inactive
    const toggleActiveMutation = useMutation({
        mutationFn: tableService.toggleActiveTable,
        onSuccess: () => queryClient.invalidateQueries(['tables'])
    });

    const regenerateMutation = useMutation({
        mutationFn: tableService.regenerateQR,
        onSuccess: () => queryClient.invalidateQueries(['tables'])
    });

    // Stats Calculation
    const activeTables = tables.filter(t => t.isActive !== false); // treat undefined as active
    const totalTables = activeTables.length;
    const occupiedTables = activeTables.filter(t => t.status === 'occupied').length;
    const freeTables = activeTables.filter(t => t.status === 'free').length;
    const inactiveTables = tables.length - totalTables; // optional: number of deactivated tables

    // Filter Logic
    const filteredTables = tables.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    const handleSave = async (formData) => {
        if (editingTable) {
            await updateMutation.mutateAsync({ id: editingTable._id, data: formData });
        } else {
            await createMutation.mutateAsync(formData);
        }
    };

    const handleBatchDownload = async (type) => {
        if (!confirm(`Download all QR codes as ${type.toUpperCase()}?`)) return;
        try {
            if (type === 'zip') await tableService.downloadBatchZIP();
            else await tableService.downloadBatchPDF();
        } catch (err) {
            alert("Failed to download batch.");
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading tables...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto font-quicksand">
            
            {/* Header & Stats */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <p className="text-gray-500 text-lg font-bold">Manage seating layout and QR codes.</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Nút Batch Operations Mới */}
                        <button 
                            onClick={() => handleBatchDownload('zip')}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 text-sm"
                        >
                            <i className="fa-solid fa-file-zipper mr-2"></i> ZIP
                        </button>
                        <button 
                            onClick={() => handleBatchDownload('pdf')}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 text-sm"
                        >
                            <i className="fa-solid fa-print mr-2"></i> Print All
                        </button>

                        <Button 
                            backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                            color="#fff"
                            text="+ Add Table"
                            onClick={() => { setEditingTable(null); setIsModalOpen(true); }}
                        />
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Tables" 
                        value={totalTables} 
                        icon="fa-layer-group" 
                        color="bg-[#D4AF37]" 
                        textColor="text-white"
                    />
                    <StatCard 
                        title="Occupied" 
                        value={occupiedTables} 
                        icon="fa-user-group" 
                        color="bg-white border border-gray-200" 
                        textColor="text-gray-800"
                        iconColor="text-orange-500"
                    />
                    <StatCard 
                        title="Available" 
                        value={freeTables} 
                        icon="fa-check" 
                        color="bg-white border border-gray-200" 
                        textColor="text-gray-800"
                        iconColor="text-green-500"
                    />
                    <StatCard 
                        title="Inactive" 
                        value={inactiveTables} 
                        icon="fa-ban" 
                        color="bg-gray-300" 
                        textColor="text-gray-800"
                        iconColor="text-red-300"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['all', 'free', 'occupied', 'reserved'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition ${
                            filter === status 
                            ? 'bg-[#1a1a1a] text-white' 
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredTables.map(table => {
                    // Logic hiển thị style dựa trên trạng thái
                    const isActive = table.isActive;
                    const isOccupied = table.status === 'occupied';
                    
                    return (
                        <div key={table._id} className={`rounded-2xl p-5 shadow-sm border-2 transition relative group ${
                            !isActive 
                                ? 'bg-gray-50 border-gray-200 opacity-80' // Style cho Inactive
                                : isOccupied 
                                    ? 'bg-white border-orange-100 hover:shadow-md' 
                                    : 'bg-white border-transparent hover:shadow-md'
                        }`}>
                            {/* Status Badge */}
                            <div className={`absolute top-4 right-4 flex items-center gap-2`}>
                                {!isActive ? (
                                    <span className="text-[10px] font-bold text-red-400 uppercase border border-red-200 px-2 py-0.5 rounded bg-red-50">
                                        <i className="fa-solid fa-ban mr-1"></i> Inactive
                                    </span>
                                ) : (
                                    <div className={`w-3 h-3 rounded-full ${
                                        table.status === 'free' ? 'bg-green-500' : 
                                        table.status === 'occupied' ? 'bg-orange-500' : 'bg-gray-400'
                                    }`}></div>
                                )}
                            </div>

                            <div className="flex flex-col items-center text-center mb-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-momo font-bold mb-3 ${
                                    !isActive ? 'bg-gray-200 text-gray-400' : 'bg-gray-50 text-gray-700'
                                }`}>
                                    {table.name.replace(/\D/g,'') || table.name.charAt(0)}
                                </div>
                                <h3 className={`font-bold text-lg ${!isActive ? 'text-gray-400' : 'text-gray-800'}`}>{table.name}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-1">{table.location}</p>
                                <p className="text-xs text-gray-400 mt-1">{table.capacity} Seats</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                                {isActive ? (
                                    <>
                                        <button 
                                            onClick={() => setQrTable(table)}
                                            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center justify-center gap-2"
                                        >
                                            <i className="fa-solid fa-qrcode"></i> QR
                                        </button>
                                        <button 
                                            onClick={() => { setEditingTable(table); setIsModalOpen(true); }}
                                            className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500"
                                            title="Edit"
                                        >
                                            <i className="fa-solid fa-pen"></i>
                                        </button>
                                        <button 
                                            onClick={() => toggleActiveMutation.mutate(table._id)}
                                            className="w-9 h-9 rounded-lg border border-orange-100 text-orange-500 hover:bg-orange-50 flex items-center justify-center"
                                            title="Deactivate (Hide)"
                                        >
                                            <i className="fa-solid fa-power-off"></i>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => toggleActiveMutation.mutate(table._id)}
                                            className="flex-1 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-bold text-gray-600 flex items-center justify-center gap-2"
                                        >
                                            Activate
                                        </button>
                                        <button 
                                            onClick={() => setDeleteId(table._id)}
                                            className="w-9 h-9 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 flex items-center justify-center"
                                            title="Delete Permanently"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modals */}
            {isModalOpen && (
                <TableModal 
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSave}
                    initialData={editingTable}
                />
            )}

            {qrTable && (
                <QRModal 
                    table={qrTable}
                    onClose={() => setQrTable(null)}
                    onRegenerate={(id) => regenerateMutation.mutateAsync(id)}
                />
            )}

            {deleteId && (
                <DeleteModal 
                    deleteId={deleteId}
                    onClose={() => setDeleteId(null)}
                    removeFunc={(id) => deleteMutation.mutateAsync(id)}
                    confirmMessage="Deactivate this table?"
                    successLog="Table deactivated."
                />
            )}
        </div>
    );
}

function StatCard({ title, value, icon, color, textColor, iconColor }) {
    return (
        <div className={`${color} p-6 rounded-2xl shadow-sm flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl ${iconColor || 'text-white'}`}>
                <i className={`fa-solid ${icon}`}></i>
            </div>
            <div>
                <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
                <div className={`text-sm font-medium opacity-80 ${textColor}`}>{title}</div>
            </div>
        </div>
    );
}