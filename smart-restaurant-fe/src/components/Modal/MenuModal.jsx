import { useState, useEffect } from "react";
import Button from "../Shared/Button";
import Input from "../Shared/Input";

export default function MenuModal({ onClose, onSuccess, initialData, categories = [] }) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [prepTime, setPrepTime] = useState("");
    const [status, setStatus] = useState("available"); // State mới cho status
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");



    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPrice(initialData.price);
            setDescription(initialData.description || "");
            const initCatId = initialData.categoryId?._id || initialData.categoryId;
            setCategoryId(initCatId || "");
            setPrepTime(initialData.prepTime || "");
            setPreview(initialData.imageUrl);

            // Logic quy đổi từ isAvailable/isSoldOut sang status
            if (initialData.isSoldOut) {
                setStatus("sold_out");
            } else if (!initialData.isAvailable) {
                setStatus("unavailable");
            } else {
                setStatus("available");
            }
        } else {
            if (categories.length > 0 && !categoryId) {
                setCategoryId(categories[0]._id);
            }
            setStatus("available"); // Mặc định là Available
        }
    }, [initialData, categories]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!name || !price || !categoryId) {
            setError("Please fill in all required fields (Name, Price, Category)");
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
            
            // Logic quy đổi từ status sang isAvailable/isSoldOut
            const isAvailable = status !== "unavailable";
            const isSoldOut = status === "sold_out";
            
            formData.append("isAvailable", isAvailable);
            formData.append("isSoldOut", isSoldOut);

            if (image) {
                formData.append("image", image);
            }

            //onSuccess là hàm xử lý edit hoặc tạo mới menu
            await onSuccess(formData);
            onClose();
        } catch (err) {
            console.error("Error saving menu item:", err);
            
            let errorMessage = "Failed to save menu item";

            if (err.response) {
                // Server trả về response với status code lỗi
                if (err.response.data) {
                    if (typeof err.response.data === 'string') {
                        errorMessage = err.response.data;
                    } else if (err.response.data.message) {
                        errorMessage = err.response.data.message;
                    } else if (err.response.data.error) {
                        errorMessage = err.response.data.error;
                    } else {
                        errorMessage = JSON.stringify(err.response.data);
                    }
                } else {
                    errorMessage = `Server Error: ${err.response.status} ${err.response.statusText}`;
                }
            } else if (err.request) {
                // Request đã được gửi nhưng không nhận được phản hồi (Lỗi mạng)
                errorMessage = "No response from server. Please check your internet connection.";
            } else {
                // Lỗi khi setup request
                errorMessage = err.message;
            }
            setError(errorMessage);
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
                            <label className="block text-sm font-bold text-gray-700 mb-1">Item Name <span className="text-red-500">*</span></label>
                            <Input type="text" value={name} placeholder="e.g. Grilled Salmon" setState={setName} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Price ($) <span className="text-red-500">*</span></label>
                                <Input type="number" value={price} placeholder="0.00" setState={setPrice} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Prep Time (min)</label>
                                <Input type="number" value={prepTime} placeholder="15" setState={setPrepTime} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                            <select
                                className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-4 outline-none focus:ring-1 focus:ring-[#D4AF37] border-r-[16px] border-transparent cursor-pointer"
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                            >
                                <option value="" disabled>Select Category</option>
                                {categories.length > 0 ? (
                                    categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))
                                ) : (
                                    <option value="" disabled>No categories available</option>
                                )}
                            </select>
                        </div>

                        {/* Thêm phần chọn Status */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                            <select
                                className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-4 outline-none focus:ring-1 focus:ring-[#D4AF37] border-r-[16px] border-transparent cursor-pointer"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                            >
                                <option value="available">Available</option>
                                <option value="sold_out">Sold Out</option>
                                <option value="unavailable">Unavailable</option>
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

                {error && <p className="text-red-500 mt-4 text-center font-medium">{error}</p>}

                <div className="flex justify-end gap-3 mt-8">
                    <Button 
                        backgrond={{ normal: "#f3f4f6", hover: "#e5e7eb" }}
                        color="#4b5563"
                        text="Cancel" 
                        onClick={onClose} 
                    />
                    <Button
                        backgrond={{ normal: "#D4AF37", hover: "#c4a02f" }}
                        color="#fff"
                        text={loading ? "Saving..." : "Save Item"}
                        onClick={handleSubmit}
                        disabled={loading || categories.length === 0}
                    />
                </div>
            </div>
        </div>
    );
}