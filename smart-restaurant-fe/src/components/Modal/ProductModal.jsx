import { useState, useEffect } from "react";

export default function ProductModal({ item, onClose, onAddToCart, initialQuantity, initialModifiers, initialNote, isEdit }) {
    const [quantity, setQuantity] = useState(initialQuantity || 1);
    const [note, setNote] = useState(initialNote || "");
    const [selections, setSelections] = useState({});
    const [totalPrice, setTotalPrice] = useState(item.price);

    // Khi mở modal, nếu là edit thì set selections từ initialModifiers
    useEffect(() => {
        if (isEdit && initialModifiers) {
            // Convert modifiers array về selections object
            const sel = {};
            (item.modifiers || []).forEach(group => {
                sel[group.name] = initialModifiers.filter(m => m.name === group.name).map(m => ({
                    name: m.option,
                    priceAdjustment: m.price,
                    _id: group.options.find(opt => opt.name === m.option)?.id || m.option
                }));
            });
            setSelections(sel);
        } else {
            setSelections({});
        }
        setQuantity(initialQuantity || 1);
        setNote(initialNote || "");
    }, [item, isEdit, initialModifiers, initialNote, initialQuantity]);

    // Tính lại tổng tiền mỗi khi thay đổi lựa chọn hoặc số lượng
    useEffect(() => {
        let modifiersPrice = 0;
        Object.values(selections).flat().forEach(opt => {
            modifiersPrice += (opt.priceAdjustment || 0);
        });
        setTotalPrice((item.price + modifiersPrice) * quantity);
    }, [selections, quantity, item.price]);

    const handleOptionToggle = (group, option) => {
        setSelections(prev => {
            const currentGroupSelections = prev[group.name] || [];
            
            if (group.selectionType === 'single') {
                // Nếu là single (Radio): Chọn cái này thì bỏ cái kia
                return { ...prev, [group.name]: [option] };
            } else {
                // Nếu là multiple (Checkbox): Toggle chọn/bỏ chọn
                const exists = currentGroupSelections.find(o => o._id === option._id);
                let newGroupSelections;
                if (exists) {
                    newGroupSelections = currentGroupSelections.filter(o => o._id !== option._id);
                } else {
                    // Check max selections
                    if (group.maxSelections && currentGroupSelections.length >= group.maxSelections) {
                        return prev; // Không cho chọn thêm nếu full
                    }
                    newGroupSelections = [...currentGroupSelections, option];
                }
                return { ...prev, [group.name]: newGroupSelections };
            }
        });
    };

    const handleConfirm = () => {
        // Validate Required Modifiers
        for (const group of item.modifiers || []) {
            if (group.isRequired && (!selections[group.name] || selections[group.name].length === 0)) {
                alert(`Please select an option for ${group.name}`);
                return;
            }
            if (group.minSelections && (!selections[group.name] || selections[group.name].length < group.minSelections)) {
                alert(`Please select at least ${group.minSelections} options for ${group.name}`);
                return;
            }
        }

        // Format dữ liệu để lưu vào Cart
        // Cart cần mảng modifiers dạng: [{ name: "Size", option: "Large", price: 2 }, ...]
        const formattedModifiers = [];
        Object.keys(selections).forEach(groupName => {
            selections[groupName].forEach(opt => {
                formattedModifiers.push({
                    name: groupName,
                    option: opt.name,
                    price: opt.priceAdjustment
                });
            });
        });

        onAddToCart(item, quantity, formattedModifiers, note);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Image */}
                <div className="relative h-48 shrink-0">
                    <img src={item.images?.[0]?.url} className="w-full h-full object-cover" alt={item.name} />
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Content Scrollable */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                        <span className="text-xl font-bold text-[#D4AF37]">${item.price}</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">{item.description}</p>

                    {/* Modifiers */}
                    <div className="space-y-6">
                        {(Array.isArray(item.modifiers) ? item.modifiers : []).map(group => (
                            <div key={group._id}>
                                <div className="flex justify-between mb-2">
                                    <h3 className="font-bold text-gray-800">
                                        {group.name} 
                                        {group.isRequired && <span className="text-red-500 text-xs ml-1">(Required)</span>}
                                    </h3>
                                    <span className="text-xs text-gray-400">
                                        {group.selectionType === 'single' ? 'Select 1' : `Max ${group.maxSelections || 'unlimited'}`}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {group.options.map(option => {
                                        const isSelected = selections[group.name]?.some(o => o._id === option._id);
                                        return (
                                            <label key={option._id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[#D4AF37] bg-[#FFF8E1]' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#D4AF37]' : 'border-gray-300'}`}>
                                                        {isSelected && <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full"></div>}
                                                    </div>
                                                    <span className={`text-sm ${isSelected ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{option.name}</span>
                                                </div>
                                                {option.priceAdjustment > 0 && (
                                                    <span className="text-sm font-medium text-gray-500">+${option.priceAdjustment}</span>
                                                )}
                                                <input 
                                                    type="checkbox" 
                                                    className="hidden" 
                                                    checked={!!isSelected}
                                                    onChange={() => handleOptionToggle(group, option)}
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Note */}
                    <div className="mt-6">
                        <h3 className="font-bold text-gray-800 mb-2">Special Instructions</h3>
                        <textarea 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#D4AF37]"
                            rows="2"
                            placeholder="E.g. No onions, extra spicy..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-4 mb-4 justify-center">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200">-</button>
                        <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200">+</button>
                    </div>
                    
                    <button 
                        onClick={handleConfirm}
                        className="w-full bg-[#1a1a1a] text-[#D4AF37] py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black transition flex justify-between px-6 items-center"
                    >
                        <span>Add to Cart</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}