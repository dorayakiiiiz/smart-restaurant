import { useState, useEffect } from "react";
import Button from "../Shared/Button";
import Input from "../Shared/Input";

export default function TableModal({ onClose, onSuccess, initialData }) {
    const [name, setName] = useState("");
    const [capacity, setCapacity] = useState(4);
    const [location, setLocation] = useState("Main Hall");
    const [description, setDescription] = useState(""); 
    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState({ type: '', content: '' });

    useEffect(() => {
        if (log.content) {
            const timer = setTimeout(() => setLog({ type: '', content: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [log.content]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setCapacity(initialData.capacity);
            setLocation(initialData.location);
            setDescription(initialData.description || "");
        }
    }, [initialData]);

    const handleSubmit = async () => {
        if (!name) return setError("Table name is required");
        
        setLoading(true);
        try {
            const data = { name, capacity: Number(capacity), location, description };
            await onSuccess(data); // Gọi hàm xử lý ở cha

            const successMsg = initialData ? "Table updated successfully." : "Table created successfully.";
            setLog({ type: 'success', content: successMsg });

            setTimeout(onClose, 1500);
        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || "Failed to save table" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-momo font-bold text-[#1a1a1a] mb-6">
                    {initialData ? "Edit Table" : "Add New Table"}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Table Name/Number</label>
                        <Input type="text" value={name} placeholder="e.g. Table 1, VIP 2" setState={setName} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Capacity (Seats)</label>
                            <input 
                                type="number" 
                                className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-4 outline-none focus:ring-1 focus:ring-[#D4AF37]"
                                value={capacity}
                                onChange={e => setCapacity(e.target.value)}
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                            <select 
                                className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-4 outline-none focus:ring-1 focus:ring-[#D4AF37]"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                            >
                                <option value="Main Hall">Main Hall</option>
                                <option value="Outdoor">Outdoor / Patio</option>
                                <option value="VIP Room">VIP Room</option>
                                <option value="Balcony">Balcony</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <input 
                            type="text" 
                            className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-4 outline-none focus:ring-1 focus:ring-[#D4AF37]"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className={`min-h-[24px] mt-6 text-center font-bold ${
                    log.type === 'error' ? 'text-red-600' : 'text-green-600 success-glow'
                }`}>
                    {log.content}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                    <Button 
                        backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                        color="#fff"
                        text={loading ? "Saving..." : "Save Table"}
                        onClick={handleSubmit}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
}