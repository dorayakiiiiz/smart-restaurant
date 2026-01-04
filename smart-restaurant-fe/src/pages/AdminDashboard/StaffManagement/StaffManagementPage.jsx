import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffService } from "../../../services/staffService";
import AdminTable from "../../../components/AdminTable";
import Button from "../../../components/Shared/Button";
import DeleteModal from "../../../components/Modal/DeleteModal";
import RoleSelectionModal from "./components/RoleSelectionModal";
import StaffFormModal from "./components/StaffFormModal";
import FilterModal from "./components/FilterModal";

export default function StaffManagementPage() {
    const queryClient = useQueryClient();

    // Modal states
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [editingStaff, setEditingStaff] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Filter states
    const [searchText, setSearchText] = useState("");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

    // Fetch Staff
    const { data, isLoading } = useQuery({
        queryKey: ['staff'],
        queryFn: staffService.getAllStaff
    });

    const staff = data?.staff || [];

    // Filter staff with useMemo for performance
    const filteredStaff = useMemo(() => {
        return staff.filter(item => {
            const matchesSearch = searchText === "" || 
                item.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
                item.email.toLowerCase().includes(searchText.toLowerCase());

            const matchesRole = selectedRoleFilter === "all" || item.role === selectedRoleFilter;

            const matchesStatus = selectedStatusFilter === "all" || 
                (selectedStatusFilter === "active" && !item.isLocked) ||
                (selectedStatusFilter === "locked" && item.isLocked);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [staff, searchText, selectedRoleFilter, selectedStatusFilter]);

    const hasActiveFilters = selectedRoleFilter !== "all" || selectedStatusFilter !== "all";

    // Mutations
    const lockMutation = useMutation({
        mutationFn: staffService.toggleLockStaff,
        onSuccess: () => queryClient.invalidateQueries(['staff'])
    });

    const deleteMutation = useMutation({
        mutationFn: staffService.deleteStaff,
        onSuccess: () => queryClient.invalidateQueries(['staff'])
    });

    // Handlers
    const handleCreateStaff = () => setIsRoleModalOpen(true);

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setIsRoleModalOpen(false);
        setIsFormModalOpen(true);
    };

    const handleEdit = (staff) => {
        setEditingStaff(staff);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setSelectedRole(null);
        setEditingStaff(null);
    };

    const handleToggleLock = (id) => lockMutation.mutate(id);

    const handleDelete = (id) => setDeleteId(id);

    const resetFilters = () => {
        setSelectedRoleFilter("all");
        setSelectedStatusFilter("all");
    };

    // Table columns
    const columns = [
        {
            header: "Staff Name",
            render: (item) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-600">
                        {item.fullName.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-800">{item.fullName}</span>
                </div>
            )
        },
        { header: "Email", accessor: "email" },
        {
            header: "Restaurant",
            render: (item) => item.restaurant ? (
                <span className="text-blue-600 font-medium">{item.restaurant.name}</span>
            ) : (
                <span className="text-gray-400 italic text-sm">N/A</span>
            )
        },
        {
            header: "Role",
            render: (item) => (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    item.role === 'waiter' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-orange-100 text-orange-700'
                }`}>
                    {item.role === 'waiter' ? '🍽️ Waiter' : '👨‍🍳 Kitchen'}
                </span>
            )
        },
        {
            header: "Status",
            render: (item) => (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                    {item.isLocked ? 'Locked' : 'Active'}
                </span>
            )
        }
    ];

    const renderActions = (item) => (
        <div className="flex gap-2">
            <button 
                onClick={() => handleEdit(item)}
                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                title="Edit Staff"
            >
                <i className="fa-solid fa-pen"></i>
            </button>

            <button 
                onClick={() => handleToggleLock(item._id)}
                className={`p-2 rounded-lg transition ${
                    item.isLocked ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'
                }`}
                title={item.isLocked ? "Unlock Account" : "Lock Account"}
            >
                <i className={`fa-solid ${item.isLocked ? 'fa-lock-open' : 'fa-lock'}`}></i>
            </button>

            <button 
                onClick={() => handleDelete(item._id)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                title="Delete Account"
            >
                <i className="fa-solid fa-trash"></i>
            </button>
        </div>
    );

    return (
        <div className="w-full max-w-6xl mx-auto font-quicksand">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold font-momo text-[#1a1a1a]">Manage Staff</h2>
                    <p className="text-gray-500">Create and manage waiter and kitchen staff accounts.</p>
                </div>
                <Button 
                    backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                    color="#fff"
                    text="+ Create Staff"
                    onClick={handleCreateStaff}
                />
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            value={searchText} 
                            onChange={(e) => setSearchText(e.target.value)} 
                            className="w-full h-[50px] rounded-xl bg-white pl-10 pr-4 outline-none border border-gray-200 focus:border-[#D4AF37] transition-colors" 
                        />
                    </div>
                </div>
                <button 
                    onClick={() => setShowFilterModal(true)} 
                    className="h-[50px] px-6 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors font-bold text-gray-700 flex items-center gap-2"
                >
                    <i className="fa-solid fa-filter"></i>
                    Filters
                    {hasActiveFilters && (
                        <span className="ml-1 w-2 h-2 bg-[#D4AF37] rounded-full"></span>
                    )}
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <AdminTable 
                    columns={columns} 
                    data={filteredStaff} 
                    isLoading={isLoading} 
                    actions={renderActions} 
                />
            </div>

            {/* Modals */}
            {isRoleModalOpen && (
                <RoleSelectionModal 
                    onClose={() => setIsRoleModalOpen(false)}
                    onSelectRole={handleRoleSelect}
                />
            )}

            {isFormModalOpen && (
                <StaffFormModal 
                    staff={editingStaff}
                    role={selectedRole}
                    onClose={handleCloseFormModal}
                    onSuccess={() => queryClient.invalidateQueries(['staff'])}
                />
            )}

            {deleteId && (
                <DeleteModal 
                    deleteId={deleteId}
                    onClose={() => setDeleteId(null)}
                    removeFunc={(id) => deleteMutation.mutateAsync(id)}
                    confirmMessage="Are you sure you want to delete this staff member?"
                    successLog="Staff deleted successfully."
                />
            )}

            {showFilterModal && (
                <FilterModal 
                    show={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    selectedRole={selectedRoleFilter}
                    setSelectedRole={setSelectedRoleFilter}
                    selectedStatus={selectedStatusFilter}
                    setSelectedStatus={setSelectedStatusFilter}
                    onApply={() => setShowFilterModal(false)}
                    onReset={resetFilters}
                />
            )}
        </div>
    );
}
