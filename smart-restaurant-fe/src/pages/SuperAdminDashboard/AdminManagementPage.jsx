import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superAdminService } from "../../services/superAdminService";
import AdminTable from "../../components/AdminTable";
import Button from "../../components/Shared/Button";
import Input from "../../components/Shared/Input";
import { Validator } from "../../utils/validators";
import DeleteModal from "../../components/Modal/DeleteModal";

export default function AdminManagementPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const [editAdmin, setEditAdmin] = useState(null);


    // Fetch Admins (thay thế useContext + useEffect)
    const { data, isLoading } = useQuery({
        queryKey: ['admins'],
        queryFn: superAdminService.getAllAdmins
    });

    const admins = data?.admins || [];

    // Lock Mutation
    const lockMutation = useMutation({
        mutationFn: superAdminService.toggleLockAdmin,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['admins']);
            // Hiện log thành công từ backend trả về
            setLog({ type: 'success', content: data.message });
        },
        onError: (err) => {
            setLog({ type: 'error', content: err.response?.data?.message || "Failed to update status." });
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: superAdminService.deleteAdmin,
        onSuccess: () => {
            queryClient.invalidateQueries(['admins']);
            // Invalidate cả stats vì số lượng admin/nhà hàng thay đổi
            queryClient.invalidateQueries(['system-stats']);
        }
    });

    const columns = [
        {
            header: "Admin Name",
            //item ở đây là 1 object admin
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
                <span className="text-gray-400 italic text-sm">Not setup</span>
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
                onClick={() => { setIsModalOpen(true); setEditAdmin(item); }}
                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                title="Edit Staff"
            >
                <i className="fa-solid fa-pen"></i>
            </button>

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

    return (
        <div className="w-full max-w-6xl mx-auto">

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Manage Owners</h2>
                    <p className="text-sm text-gray-500">Create and manage restaurant administrator accounts.</p>
                </div>
                <Button 
                    backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                    color="#fff"
                    text="+ Create Owner"
                    onClick={() => setIsModalOpen(true)}
                />
            </div>

            <div className={`my-3 min-h-6 text-center text-sm font-semibold ${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600 success-glow' : ''}`}>
                {log.content}
            </div>

            <AdminTable 
                columns={columns} 
                data={admins} 
                isLoading={isLoading} 
                actions={renderActions} 
            />

            {isModalOpen && (
                <AdminModal 
                    editAdmin={editAdmin}
                    onClose={() => { setIsModalOpen(false); setEditAdmin(null) }} 
                    onSuccess={() => queryClient.invalidateQueries(['admins'])}
                />
            )}

            {deleteId && (
                <DeleteModal 
                    deleteId={deleteId}
                    onClose={() => setDeleteId(null)}
                    removeFunc={(id) => deleteMutation.mutateAsync(id)}
                    confirmMessage="Are you sure you want to delete this Admin?"
                    successLog="Admin deleted successfully."
                />
            )}
        </div>
    );
}

function AdminModal({ editAdmin = null, onClose, onSuccess }) {
    const [email, setEmail] = useState(editAdmin?.email || "");
    const [fullName, setFullName] = useState(editAdmin?.fullName || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [log, setLog] = useState({ type: '', content: '' });

    useEffect(() => {
        if (log.content) {
            setTimeout(() => setLog({ type: '', content: '' }), 2600);
        }
    }, [log]);

    const createMutation = useMutation({
        mutationFn: (data) => superAdminService.createAdmin(data),
        onSuccess: () => {
            onSuccess();
            setLog({ type: 'success', content: 'Created admin successfully.' });

            setTimeout(onClose, 2000);
        },
        onError: (err) => {
            setLog({ type: 'error', content: err.response?.data?.message || "Failed to create admin." });
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => superAdminService.updateAdmin(id, data),
        onSuccess: () => {
            onSuccess();
            setLog({ type: 'success', content: 'Updated admin information successfully.' });

            setTimeout(onClose, 2000);
        },
        onError: (err) => {
            setLog({ type: 'error', content: err.response?.data?.message || "Failed to update admin." });
        }
    })

    const handleSubmit = async (e) => {
        // Ngăn chặn reload trang
        e.preventDefault();

        // validate data
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

        if (!editAdmin || (editAdmin && password.trim() !== "")) {
            const passwordError = Validator.validatePassword(password);
            if (passwordError) {
                setLog({ type: 'error', content: passwordError });
                return;
            }
    
            if (confirmPassword !== password) {
                setLog({ type: 'error', content: 'Passwords do not match.' });
                return;
            }
        }

        const data = { email, fullName };
        if (password)
            data.password = password;

        if (editAdmin)
            updateMutation.mutate({ id: editAdmin._id, data });
        else
            createMutation.mutate(data);

    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-xl p-10 shadow-2xl" 
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold font-momo text-[#800020] mb-6">
                    {editAdmin ? 'Update Owner Information' : 'Create New Owner'}
                </h3>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <Input type="email" value={email} placeholder="owner@example.com" setState={setEmail} />
                    
                    <label className="text-sm font-semibold text-gray-700 mt-2">Full Name</label>
                    <Input type="text" value={fullName} placeholder="John Doe" setState={setFullName} />
                    
                    <label className="text-sm font-semibold text-gray-700 mt-2">Password <span className="text-gray-400 ml-1">(leave blank to keep current)</span></label>
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
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-1 py-3 rounded-xl bg-[#1a1a1a] text-white font-semibold hover:bg-[#333] transition disabled:opacity-70"
                        >
                            {editAdmin ? (updateMutation.isPending ? 'Updating...' : 'Update Account') : (createMutation.isPending ? 'Creating...' : 'Create Account')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}



