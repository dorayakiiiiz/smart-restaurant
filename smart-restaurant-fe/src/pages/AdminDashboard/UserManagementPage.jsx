import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";

// Hook debounce đơn giản
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    // Fetch Users
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users', debouncedSearch],
        queryFn: async () => {
            // API này cần backend hỗ trợ filter, tạm thời lấy all
            const res = await api.get('/admin/owners'); // Tạm dùng api owners hoặc api users tùy role
            return res.data.owners || [];
        }
    });

    const lockMutation = useMutation({
        mutationFn: async (userId) => await api.patch(`/admin/users/${userId}/lock`),
        onSuccess: () => queryClient.invalidateQueries(['users'])
    });

    return (
        <div className="p-6 w-full">
            <h1 className="text-2xl font-bold mb-6 font-momo text-[#153d18]">Staff Management</h1>
            
            <div className="mb-4">
                <input 
                    type="text" 
                    placeholder="Search staff..." 
                    className="p-2 border rounded-lg w-full max-w-md"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl shadow border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr> : 
                        users.map(user => (
                            <tr key={user._id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{user.displayName}</td>
                                <td className="p-4 text-gray-500">{user.email}</td>
                                <td className="p-4 capitalize">{user.role}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {user.isLocked ? 'Locked' : 'Active'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => lockMutation.mutate(user._id)}
                                        className="text-gray-500 hover:text-red-600"
                                    >
                                        <i className={`fa-solid ${user.isLocked ? 'fa-lock-open' : 'fa-lock'}`}></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}