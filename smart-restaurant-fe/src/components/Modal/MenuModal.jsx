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
    const [isChefRecommended, setIsChefRecommended] = useState(false);

    const [modifiers, setModifiers] = useState([]); // State mới cho modifiers
    const [activeTab, setActiveTab] = useState("general"); // Tab chuyển đổi: 'general' | 'modifiers'


    // Tìm category đang được chọn để kiểm tra trạng thái
    const selectedCategory = categories.find(c => c._id === categoryId);
    const isCategoryInactive = selectedCategory && !selectedCategory.isActive;

    // Tự động chuyển status về unavailable nếu category inactive
    useEffect(() => {
        if (isCategoryInactive) {
            setStatus("unavailable");
        }
    }, [categoryId, categories]);


    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setPrice(initialData.price);
            setDescription(initialData.description || "");
            const initCatId = initialData.categoryId?._id || initialData.categoryId;
            setCategoryId(initCatId || "");
            setPrepTime(initialData.prepTime || "");
            setPreview(initialData.imageUrl);
            setIsChefRecommended(initialData.isChefRecommended || false);
            setModifiers(initialData.modifiers || []);

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
            setIsChefRecommended(false);
            setModifiers([]);
        }
    }, [initialData, categories]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };


    // --- MODIFIER HANDLERS ---
    const addModifierGroup = () => {
        setModifiers([
            ...modifiers,
            {
                name: "",
                selectionType: "single",
                isRequired: false,
                minSelections: 0,
                maxSelections: 1,
                options: []
            }
        ]);
    };

    const removeModifierGroup = (index) => {
        const newModifiers = [...modifiers];
        newModifiers.splice(index, 1);
        setModifiers(newModifiers);
    };

    const updateModifierGroup = (index, field, value) => {
        const newModifiers = [...modifiers];
        newModifiers[index][field] = value;
        setModifiers(newModifiers);
    };

    const addOption = (groupIndex) => {
        const newModifiers = [...modifiers];
        newModifiers[groupIndex].options.push({
            name: "",
            priceAdjustment: 0,
            isDefault: false,
            isActive: true
        });
        setModifiers(newModifiers);
    };

    const removeOption = (groupIndex, optionIndex) => {
        const newModifiers = [...modifiers];
        newModifiers[groupIndex].options.splice(optionIndex, 1);
        setModifiers(newModifiers);
    };

    const updateOption = (groupIndex, optionIndex, field, value) => {
        const newModifiers = [...modifiers];
        newModifiers[groupIndex].options[optionIndex][field] = value;
        setModifiers(newModifiers);
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
            
            //Đây là các giá trị boolean
            formData.append("isAvailable", isAvailable);
            formData.append("isSoldOut", isSoldOut);
            formData.append("isChefRecommended", isChefRecommended);
            formData.append("modifiers", JSON.stringify(modifiers));

            if (image) {
                formData.append("images", image);
            }

            //onSuccess là hàm xử lý edit hoặc tạo mới menu
            await onSuccess(formData);
            onClose(); //Tắt sau khi thành công
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
                errorMessage = "Please check your internet connection.";
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


                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 mb-6">
                    <button 
                        className={`pb-2 px-1 font-bold text-sm transition-colors ${activeTab === 'general' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General Info
                    </button>
                    <button 
                        className={`pb-2 px-1 font-bold text-sm transition-colors ${activeTab === 'modifiers' ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('modifiers')}
                    >
                        Modifiers & Options
                    </button>
                </div>
                {activeTab === 'general' ? (
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

                            {/* Chef Recommendation Checkbox */}
                            <div className="flex items-center gap-3 p-3 bg-[#f7f8f6] rounded-xl border border-transparent hover:border-[#D4AF37] transition-colors cursor-pointer" onClick={() => setIsChefRecommended(!isChefRecommended)}>
                                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${isChefRecommended ? 'bg-[#D4AF37] border-[#D4AF37]' : 'bg-white border-gray-300'}`}>
                                    {isChefRecommended && <i className="fa-solid fa-check text-white text-xs"></i>}
                                </div>
                                <span className="text-sm font-bold text-gray-700 select-none">Chef Recommendation</span>
                                <i className="fa-solid fa-hat-chef text-[#D4AF37] ml-auto"></i>
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
                ) : (
                    // --- MODIFIERS TAB CONTENT ---
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Customization Groups</h3>
                            <button 
                                onClick={addModifierGroup}
                                className="text-sm bg-[#1a1a1a] text-white px-3 py-1.5 rounded-lg hover:bg-[#333]"
                            >
                                + Add Group
                            </button>
                        </div>

                        {modifiers.length === 0 && (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                                No modifiers yet. Add a group like "Size" or "Toppings".
                            </div>
                        )}

                        {modifiers.map((group, gIndex) => (
                            <div key={gIndex} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                {/* Group Header */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Group Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#D4AF37] outline-none"
                                            placeholder="e.g. Size"
                                            value={group.name}
                                            onChange={e => updateModifierGroup(gIndex, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Type</label>
                                            <select 
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"
                                                value={group.selectionType}
                                                onChange={e => updateModifierGroup(gIndex, 'selectionType', e.target.value)}
                                            >
                                                <option value="single">Single Select (Radio)</option>
                                                <option value="multiple">Multi Select (Checkbox)</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end pb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={group.isRequired}
                                                    onChange={e => updateModifierGroup(gIndex, 'isRequired', e.target.checked)}
                                                    className="w-4 h-4 accent-[#D4AF37]"
                                                />
                                                <span className="text-sm font-medium">Required</span>
                                            </label>
                                        </div>
                                        {/* Xóa modifiers */}
                                        <button onClick={() => removeModifierGroup(gIndex)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg self-end">
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>

                                {/* Options List */}
                                <div className="bg-white rounded-lg border border-gray-200 p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Options</span>
                                        <button onClick={() => addOption(gIndex)} className="text-xs text-[#D4AF37] font-bold hover:underline">+ Add Option</button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {group.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex gap-2 items-center">
                                                <input 
                                                    type="text" 
                                                    placeholder="Option Name"
                                                    className="flex-grow border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-[#D4AF37]"
                                                    value={opt.name}
                                                    onChange={e => updateOption(gIndex, oIndex, 'name', e.target.value)}
                                                />
                                                <div className="relative w-24">
                                                    <span className="absolute left-2 top-1 text-gray-400 text-sm">+$</span>
                                                    <input 
                                                        type="number" 
                                                        placeholder="0"
                                                        className="w-full border border-gray-200 rounded pl-6 pr-2 py-1 text-sm outline-none focus:border-[#D4AF37]"
                                                        value={opt.priceAdjustment}
                                                        onChange={e => updateOption(gIndex, oIndex, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <button onClick={() => removeOption(gIndex, oIndex)} className="text-gray-400 hover:text-red-500 px-1">
                                                    <i className="fa-solid fa-xmark"></i>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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