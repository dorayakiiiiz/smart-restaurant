import { useState } from "react";
import Button from "../Shared/Button";
import Input from "../Shared/Input";

// onEdit là HÀM sửa category (cần truyền từ cha vào)
export default function CategoryModal({ onClose, categories, onAdd, onDelete, onEdit }) {
    const [newCategoryName, setNewCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    
    // State cho việc sửa
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");

    const handleAdd = async () => {
        if (!newCategoryName.trim()) return;
        setLoading(true);
        try {
            await onAdd(newCategoryName);
            setNewCategoryName("");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (category) => {
        setEditingId(category._id);
        setEditName(category.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName("");
    };

    const saveEdit = async () => {
        if (!editName.trim()) return;
        try {
            await onEdit(editingId, editName);
            //Trả lại trạng thái ban đầu
            setEditingId(null);
            setEditName("");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-[#1a1a1a]">Manage Categories</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Add New Category */}
                <div className="flex gap-2 mb-6">
                    <div className="flex-1">
                        <Input 
                            type="text" 
                            value={newCategoryName} 
                            placeholder="New Category Name" 
                            setState={setNewCategoryName} 
                        />
                    </div>
                    <Button 
                        text={loading ? "..." : "Add"}
                        onClick={handleAdd}
                        backgrond={{ normal: "#D4AF37", hover: "#c4a02f" }}
                        color="#fff"
                        disabled={loading || !newCategoryName.trim()}
                    />
                </div>

                {/* List Categories */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {categories.length === 0 ? (
                        <p className="text-center text-gray-400 py-4">No categories yet.</p>
                    ) : (
                        categories.map(cat => (
                            <div key={cat._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-[#D4AF37] transition-colors">
                                {editingId === cat._id ? (
                                    // Edit Mode
                                    <div className="flex gap-2 w-full">
                                        <input 
                                            type="text" 
                                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1 outline-none focus:border-[#D4AF37]"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            autoFocus
                                        />
                                        {/* Nút tick */}
                                        <button onClick={saveEdit} className="text-green-600 hover:bg-green-50 p-2 rounded-lg">
                                            <i className="fa-solid fa-check"></i>
                                        </button>
                                        {/* Nút cancel */}
                                        <button onClick={cancelEditing} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                ) : (
                                    // View Mode
                                    <>
                                        <span className="font-medium text-gray-700">{cat.name}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Nút edit */}
                                            <button 
                                                onClick={() => startEditing(cat)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                                title="Edit Name"
                                            >
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            {/* Thùng rác */}
                                            <button 
                                                onClick={() => onDelete(cat._id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Delete Category"
                                            >
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}