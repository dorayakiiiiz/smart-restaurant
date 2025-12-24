import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffService } from "../../services/staffService";
import AdminTable from "../../components/AdminTable";
import Button from "../../components/Shared/Button";
import Input from "../../components/Shared/Input";
import { Validator } from "../../utils/validators";
import DeleteModal from "../../components/Modal/DeleteModal";

export default function StaffManagementPage() {
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null); // 'waiter' hoặc 'kitchen'
    const queryClient = useQueryClient();

    // State hiển thị thông báo (Log)
    const [log, setLog] = useState({ type: '', content: '' });

    useEffect(() => {
        if (log.content) {
            const timer = setTimeout(() => setLog({ type: '', content: '' }), 2500);
            return () => clearTimeout(timer);
        }
    }, [log]);

    // State cho Delete Modal
    const [deleteId, setDeleteId] = useState(null);

    // Fetch Staff
    const { data, isLoading } = useQuery({
        queryKey: ['staff'],
        queryFn: staffService.getAllStaff
    });

    const staff = data?.staff || [];

    // Lock Mutation
    const lockMutation = useMutation({
        mutationFn: staffService.toggleLockStaff,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['staff']);
            setLog({ type: 'success', content: data.message });
        },
        onError: (err) => {
            setLog({ type: 'error', content: err.response?.data?.message || "Failed to update status." });
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: staffService.deleteStaff,
        onSuccess: () => {
            queryClient.invalidateQueries(['staff']);
        }
    });

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
                onClick={() => lockMutation.mutate(item._id)}
                className={`p-2 rounded-lg transition ${
                    item.isLocked ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'
                }`}
                title={item.isLocked ? "Unlock Account" : "Lock Account"}
            >
                <i className={`fa-solid ${item.isLocked ? 'fa-lock-open' : 'fa-lock'}`}></i>
            </button>

            <button 
                onClick={() => setDeleteId(item._id)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                title="Delete Account"
            >
                <i className="fa-solid fa-trash"></i>
            </button>
        </div>
    );

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setIsRoleModalOpen(false);
        setIsFormModalOpen(true);
    };

    return (
        <div className="w-full max-w-6xl mx-auto">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Manage Staff</h2>
                    <p className="text-sm text-gray-500">Create and manage waiter and kitchen staff accounts.</p>
                </div>
                <Button 
                    backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                    color="#fff"
                    text="+ Create Staff"
                    onClick={() => setIsRoleModalOpen(true)}
                />
            </div>

            <div className={`my-3 min-h-6 text-center text-sm font-semibold ${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600 success-glow' : ''}`}>
                {log.content}
            </div>

            <AdminTable 
                columns={columns} 
                data={staff} 
                isLoading={isLoading} 
                actions={renderActions} 
            />

            {/* Modal chọn role */}
            {isRoleModalOpen && (
                <RoleSelectionModal 
                    onClose={() => setIsRoleModalOpen(false)}
                    onSelectRole={handleRoleSelect}
                />
            )}

            {/* Modal nhập thông tin */}
            {isFormModalOpen && (
                <CreateStaffModal 
                    role={selectedRole}
                    onClose={() => {
                        setIsFormModalOpen(false);
                        setSelectedRole(null);
                    }}
                    onSuccess={() => queryClient.invalidateQueries(['staff'])}
                />
            )}

            {/* Modal xóa */}
            {deleteId && (
                <DeleteModal 
                    deleteId={deleteId}
                    onClose={() => setDeleteId(null)}
                    removeFunc={(id) => deleteMutation.mutateAsync(id)}
                    confirmMessage="Are you sure you want to delete this staff member?"
                    successLog="Staff deleted successfully."
                />
            )}
        </div>
    );
}

// Modal chọn role (Bước 1)
function RoleSelectionModal({ onClose, onSelectRole }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl" 
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold font-momo text-[#1a1a1a] mb-2">Create Staff</h3>
                <p className="text-gray-500 text-sm mb-6">Select the type of staff you want to create</p>
                
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => onSelectRole('waiter')}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            🍽️
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 group-hover:text-blue-600">Waiter</div>
                            <div className="text-xs text-gray-500">Front-of-house staff for serving customers</div>
                        </div>
                    </button>

                    <button
                        onClick={() => onSelectRole('kitchen')}
                        className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            👨‍🍳
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-800 group-hover:text-orange-600">Kitchen Staff</div>
                            <div className="text-xs text-gray-500">Back-of-house staff for food preparation</div>
                        </div>
                    </button>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full mt-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// Modal nhập thông tin (Bước 2) - Giống CreateAdminModal
function CreateStaffModal({ role, onClose, onSuccess }) {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [log, setLog] = useState({ type: '', content: '' });

    useEffect(() => {
        if (log.content) {
            setTimeout(() => setLog({ type: '', content: '' }), 2600);
        }
    }, [log]);

    const { mutate, isPending } = useMutation({
        mutationFn: (data) => staffService.createStaff(data),
        onSuccess: () => {
            onSuccess();
            setLog({ type: 'success', content: 'Created staff successfully.' });
            setTimeout(onClose, 2000);
        },
        onError: (err) => {
            setLog({ type: 'error', content: err.response?.data?.message || "Failed to create staff." });
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate data
        const emailError = Validator.validateEmail(email);
        if (emailError) {
            setLog({ type: 'error', content: emailError });
            return;
        }

        const fullNameError = Validator.validateFullName(fullName);
        if (fullNameError) {
            setLog({ type: 'error', content: fullNameError });
            return;
        }

        const passwordError = Validator.validatePassword(password);
        if (passwordError) {
            setLog({ type: 'error', content: passwordError });
            return;
        }

        if (confirmPassword !== password) {
            setLog({ type: 'error', content: 'Passwords do not match.' });
            return;
        }

        mutate({ email, fullName, password, role });
    };

    const roleTitle = role === 'waiter' ? 'Waiter' : 'Kitchen Staff';
    const roleIcon = role === 'waiter' ? '🍽️' : '👨‍🍳';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-xl p-10 shadow-2xl" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{roleIcon}</span>
                    <h3 className="text-2xl font-bold font-momo text-[#1a1a1a]">Create {roleTitle}</h3>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <Input type="email" value={email} placeholder="staff@example.com" setState={setEmail} />
                    
                    <label className="text-sm font-semibold text-gray-700 mt-2">Full Name</label>
                    <Input type="text" value={fullName} placeholder="John Doe" setState={setFullName} />
                    
                    <label className="text-sm font-semibold text-gray-700 mt-2">Password</label>
                    <Input type="password" value={password} placeholder="Secure password" setState={setPassword} />

                    <label className="text-sm font-semibold text-gray-700 mt-2">Confirm Password</label>
                    <Input type="password" value={confirmPassword} placeholder="Secure password" setState={setConfirmPassword} />

                    <div className={`text-center text-sm font-semibold ${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600 success-glow' : ''}`}>
                        {log.content}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>

                        <button 
                            type="submit"
                            disabled={isPending}
                            className="flex-1 py-3 rounded-xl bg-[#1a1a1a] text-white font-semibold hover:bg-[#333] transition disabled:opacity-70"
                        >
                            {isPending ? "Creating..." : "Create Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
