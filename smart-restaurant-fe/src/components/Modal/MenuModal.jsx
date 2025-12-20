import { useState, useEffect } from "react";
import Button from "../Shared/Button";
import Input from "../Shared/Input";

export default function MenuModal({ onClose, onSuccess, initialData, categories }) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [prepTime, setPrepTime] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Nếu đang chỉnh sửa, điền dữ liệu ban đầu
        if (initialData) {
            setName(initialData.name);
            setPrice(initialData.price);
            setDescription(initialData.description || "");
            setCategoryId(initialData.categoryId?._id || initialData.categoryId || "");
            setPrepTime(initialData.prepTime || "");
            setPreview(initialData.imageUrl);
        }
        // Nếu thêm mới, reset tất cả 
        else if (categories.length > 0) {
            setCategoryId(categories[0]._id);
        }
    }, [initialData, categories]);

    //Chỉ hiển thị preview khi chọn ảnh mới
    const handleImageChange = (e) => {
        //Lấy file từ input
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            // Hiển thị preview
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!name || !price || !categoryId) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("price", price);
            formData.append("description", description);
            formData.append("categoryId", categoryId);
            formData.append("prepTime", prepTime);
            if (image) {
                formData.append("image", image);
            }

            // hàm onSuccess là save
            await onSuccess(formData);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to save menu item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">
                    {initialData ? "Edit Menu Item" : "Add New Menu Item"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
                            <Input type="text" value={name} placeholder="e.g. Grilled Salmon" setState={setName} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Price ($)</label>
                                <Input type="number" value={price} placeholder="0.00" setState={setPrice} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Prep Time (min)</label>
                                <Input type="number" value={prepTime} placeholder="15" setState={setPrepTime} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                            <select
                                className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-4 outline-none focus:ring-1 focus:ring-[#D4AF37]"
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                            <textarea
                                className="w-full rounded-xl bg-[#f7f8f6] p-4 outline-none focus:ring-1 focus:ring-[#D4AF37] min-h-[100px]"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe the dish..."
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Image</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative h-[200px] flex items-center justify-center overflow-hidden">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageChange}
                                />
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <div className="text-gray-400">
                                        <span className="block text-4xl mb-2">+</span>
                                        <span>Upload Image</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

                <div className="flex justify-end gap-3 mt-8">
                    <Button 
                        backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                        color="#fff"
                        text="Cancel" 
                        onClick={onClose} 
                    />
                    <Button
                        backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                        color="#fff"
                        text={loading ? "Saving..." : "Save Item"}
                        onClick={handleSubmit}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
}