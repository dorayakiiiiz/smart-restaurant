
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../../services/categoryService";
import Button from "../../components/Shared/Button";

export default function CategoriesManagement() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("order"); // order, name, newest

    // --- Queries ---
    const { data: categoryData, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryService.getCategories
    });

    const categories = categoryData?.categories || [];

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: categoryService.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            setIsFormOpen(false);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => categoryService.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            setIsFormOpen(false);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: categoryService.deleteCategory,
        onSuccess: () => queryClient.invalidateQueries(['categories'])
    });

    // --- Handlers ---
    const handleDelete = async (id) => {
        if (window.confirm("Delete this category? Items in this category will be uncategorized.")) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingCategory(null);
        setIsFormOpen(true);
    };

    const resetForm = () => {
        setEditingCategory(null);
    };

    // --- Filter & Sort ---
    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredCategories.sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'order') return (a.order || 0) - (b.order || 0);
        return 0;
    });

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="font-quicksand p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-momo text-[#1a1a1a]">Categories Management</h1>
                    <p className="text-gray-500">Manage your menu categories</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        backgrond={{ normal: "#fff", hover: "#f9fafb" }}
                        color="#1a1a1a"
                        text="Trash Bin" 
                        onClick={() => setIsTrashOpen(true)} 
                        className="border border-gray-200"
                    />
                    <Button 
                        backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                        color="#fff"
                        text="+ Add Category" 
                        onClick={handleAddNew} 
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-4 mb-8 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full h-[50px] rounded-xl bg-white pl-10 pr-4 outline-none border border-gray-200 focus:border-[#D4AF37] transition-colors"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <select
                    className="h-[50px] rounded-xl bg-white px-4 outline-none border border-gray-200 focus:border-[#D4AF37] cursor-pointer min-w-[150px]"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                >
                    <option value="order">Sort by: Order</option>
                    <option value="name">Sort by: Name</option>
                    <option value="newest">Sort by: Newest</option>
                </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCategories.map(cat => (
                    <div key={cat._id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-[#f7f8f6] flex items-center justify-center text-[#D4AF37] font-bold text-xl">
                                {cat.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleEdit(cat)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                    <i className="fa-solid fa-pen"></i>
                                </button>
                                <button 
                                    onClick={() => handleDelete(cat._id)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>

                        <h3 className="font-bold text-lg text-gray-800 mb-2">{cat.name}</h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-[40px]">
                            {cat.description || "No description"}
                        </p>

                        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                            {/* Order */}
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <span>Order: {cat.itemCount}</span>
                            </div>
                            {/* Active or inactive */}
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {cat.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {isFormOpen && (
                <CategoryFormModal 
                    category={editingCategory} 
                    onClose={() => setIsFormOpen(false)} 
                    createMutation={createMutation}
                    updateMutation={updateMutation}
                />
            )}

            {isTrashOpen && (
                <CategoryTrashModal 
                    onClose={() => setIsTrashOpen(false)} 
                />
            )}
        </div>
    );
}

// --- Sub-components ---

function CategoryFormModal({ category, onClose, createMutation, updateMutation }) {
    const [formData, setFormData] = useState({
        name: category?.name || "",
        description: category?.description || "",
        order: category?.order || 0,
        isActive: category ? category.isActive : true
    });
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError("Name is required");
            return;
        }

        const data = {
            name: formData.name,
            description: formData.description,
            order: parseInt(formData.order),
            isActive: formData.isActive
        };

        if (category) {
            updateMutation.mutate({ id: category._id, data }, {
                onError: (err) => setError(err.response?.data?.message || "Error updating category")
            });
        } else {
            createMutation.mutate(data, {
                onError: (err) => setError(err.response?.data?.message || "Error creating category")
            });
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#1a1a1a]">
                        {category ? 'Edit Category' : 'New Category'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</div>}
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Appetizers"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                        <textarea 
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="Optional description..."
                            rows="3"
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Display Order</label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors"
                                value={formData.order}
                                onChange={e => setFormData({...formData, order: e.target.value})}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                            <select 
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
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
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-[#1a1a1a] text-white rounded-xl font-bold hover:bg-[#333] transition-colors disabled:opacity-50"
                        >
                            {isLoading ? "Saving..." : "Save Category"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CategoryTrashModal({ onClose }) {
    const queryClient = useQueryClient();
    const { data: trashData, isLoading } = useQuery({
        queryKey: ['categories', 'trash'],
        queryFn: categoryService.getTrashCategories
    });

    const trashCategories = trashData?.categories || [];

    const restoreMutation = useMutation({
        mutationFn: categoryService.restoreCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['categories', 'trash']);
            queryClient.invalidateQueries(['categories']);
        }
    });

    const forceDeleteMutation = useMutation({
        mutationFn: categoryService.forceDeleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['categories', 'trash']);
        }
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#1a1a1a]">Trash Bin</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {isLoading ? (
                    <p className="text-center py-8">Loading...</p>
                ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {trashCategories.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                                <i className="fa-regular fa-trash-can text-4xl text-gray-300 mb-3"></i>
                                <p className="text-gray-500">Trash is empty</p>
                            </div>
                        ) : (
                            trashCategories.map(cat => (
                                <div key={cat._id} className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{cat.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Deleted: {new Date(cat.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => restoreMutation.mutate(cat._id)}
                                            disabled={restoreMutation.isPending}
                                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-green-600 hover:bg-green-50 transition-colors"
                                        >
                                            Restore
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(window.confirm("Permanently delete?")) forceDeleteMutation.mutate(cat._id);
                                            }}
                                            disabled={forceDeleteMutation.isPending}
                                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}