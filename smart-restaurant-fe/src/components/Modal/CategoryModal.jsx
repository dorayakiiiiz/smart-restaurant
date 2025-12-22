import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "../Shared/Button";
import Input from "../Shared/Input";
import { categoryService } from "../../services/categoryService";

export default function CategoryModal({ onClose, categories, onAdd, onDelete, onEdit, onRefresh }) {
    const queryClient = useQueryClient();
    const [view, setView] = useState("list"); // 'list', 'form', 'trash'
    const [sortBy, setSortBy] = useState("acs");
    
    const [formData, setFormData] = useState({
        id: null,
        name: "",
        description: "",
        order: 0,
        isActive: true
    });
    const [error, setError] = useState("");

    // 1. Fetch Trash Categories (useQuery)
    // Chỉ fetch khi đang ở view 'trash'
    const { data: trashData, isLoading: loadingTrash } = useQuery({
        queryKey: ['categories', 'trash'],
        queryFn: categoryService.getTrashCategories,
        enabled: view === 'trash', // Chỉ chạy khi view là trash
    });

    const trashCategories = trashData?.categories || [];

    // 2. Mutations
    const restoreMutation = useMutation({
        mutationFn: categoryService.restoreCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['categories', 'trash']); // Refresh trash list
            queryClient.invalidateQueries(['categories']); // Refresh main list
            if (onRefresh) onRefresh();
        },
        onError: (err) => console.error("Restore failed", err)
    });

    const forceDeleteMutation = useMutation({
        mutationFn: categoryService.forceDeleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['categories', 'trash']);
        },
        onError: (err) => console.error("Force delete failed", err)
    });

    const createMutation = useMutation({
        mutationFn: onAdd, // onAdd từ props (đã là mutation ở parent hoặc service call)
        onSuccess: () => {
            setView("list");
            resetForm();
        },
        onError: (err) => handleError(err)
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => onEdit(id, data), // onEdit từ props
        onSuccess: () => {
            setView("list");
            resetForm();
        },
        onError: (err) => handleError(err)
    });

    // Helper xử lý lỗi
    const handleError = (err) => {
        console.error(err);
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "An error occurred";
        if (errorMessage.includes("E11000") || errorMessage.includes("duplicate key")) {
            setError("Category name already exists. Please choose a different name.");
        } else {
            setError(errorMessage);
        }
    };

    // Handlers
    const handleRestore = (id) => {
        restoreMutation.mutate(id);
    };

    const handleForceDelete = (id) => {
        if (window.confirm("Permanently delete this category? This cannot be undone.")) {
            forceDeleteMutation.mutate(id);
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            name: "",
            description: "",
            order: 0,
            isActive: true
        });
        setError("");
    };

    const handleAddNewClick = () => {
        resetForm();
        setView("form");
    };

    const handleEditClick = (cat) => {
        setFormData({
            id: cat._id,
            name: cat.name,
            description: cat.description || "",
            order: cat.order || 0,
            isActive: cat.isActive
        });
        setView("form");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError("Name is required");
            return;
        }
        if (formData.name.length < 2 || formData.name.length > 50) {
            setError("Name must be between 2 and 50 characters");
            return;
        }
        if (formData.order < 0) {
            setError("Order must be non-negative");
            return;
        }

        const data = {
            name: formData.name,
            description: formData.description,
            order: parseInt(formData.order),
            isActive: formData.isActive
        };

        if (formData.id) {
            updateMutation.mutate({ id: formData.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    // Logic sắp xếp categories (Main list)
    const sortedCategories = [...categories].sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'date') {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        else if (sortBy === 'desc') {
            return (b.itemCount || 0) - (a.itemCount || 0);
        }
        return (a.itemCount || 0) - (b.itemCount || 0);
    });

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#1a1a1a]">
                        {view === 'list' ? 'Manage Categories' : (view === 'trash' ? 'Trash Bin' : (formData.id ? 'Edit Category' : 'New Category'))}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {view === 'list' ? (
                    // --- LIST VIEW ---
                    <>
                        <div className="flex gap-2 mb-4">
                            <Button 
                                text="+ Add New"
                                onClick={handleAddNewClick}
                                backgrond={{ normal: "#D4AF37", hover: "#c4a02f" }}
                                color="#fff"
                                className="flex-1"
                            />
                            <button 
                                onClick={() => setView('trash')}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-colors"
                                title="Trash Bin"
                            >
                                <i className="fa-solid fa-trash-can"></i>
                            </button>
                        </div>

                        {/* Sort Controls */}
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total: {categories.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">Sort by:</span>
                                <select 
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#D4AF37] bg-gray-50 text-gray-600 cursor-pointer hover:bg-white transition-colors"
                                >
                                    <option value="acs">Display Order (Ascending)</option>
                                    <option value="desc">Display Order (Descending)</option>
                                    <option value="name">Name (A-Z)</option>
                                    <option value="date">Date Created</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {sortedCategories.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">No categories yet.</p>
                            ) : (
                                sortedCategories.map(cat => (
                                    <div key={cat._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-[#D4AF37] transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-700">{cat.name}</span>
                                                {!cat.isActive && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Inactive</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 flex gap-3 mt-1">
                                                <span>Order: {cat.order}</span>
                                                <span>Items: {cat.itemCount || 0}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEditClick(cat)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                            >
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            <button 
                                                onClick={() => onDelete(cat._id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : view === 'trash' ? (
                    // --- TRASH VIEW ---
                    <>
                        <div className="mb-4">
                            <button 
                                onClick={() => setView('list')}
                                className="flex items-center gap-2 text-gray-500 hover:text-[#1a1a1a] transition-colors"
                            >
                                <i className="fa-solid fa-arrow-left"></i> Back to List
                            </button>
                        </div>

                        {loadingTrash ? (
                            <p className="text-center py-4">Loading trash...</p>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {trashCategories.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <i className="fa-regular fa-trash-can text-3xl mb-2"></i>
                                        <p>Trash is empty</p>
                                    </div>
                                ) : (
                                    trashCategories.map(cat => (
                                        <div key={cat._id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-700">{cat.name}</span>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Deleted: {new Date(cat.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleRestore(cat._id)}
                                                    disabled={restoreMutation.isPending}
                                                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors disabled:opacity-50"
                                                    title="Restore"
                                                >
                                                    {restoreMutation.isPending ? '...' : 'Restore'}
                                                </button>
                                                <button 
                                                    onClick={() => handleForceDelete(cat._id)}
                                                    disabled={forceDeleteMutation.isPending}
                                                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                                                    title="Delete Permanently"
                                                >
                                                    {forceDeleteMutation.isPending ? '...' : 'Delete'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    // --- FORM VIEW ---
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Appetizers"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="Optional description..."
                                rows="2"
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                                    value={formData.order}
                                    onChange={e => setFormData({...formData, order: e.target.value})}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                                    value={formData.isActive}
                                    onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button 
                                type="button"
                                onClick={() => setView("list")}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#c4a02f] disabled:opacity-50"
                            >
                                {isLoading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}