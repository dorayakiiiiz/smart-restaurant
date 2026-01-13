import ProductModal from "../../components/Modal/ProductModal"; // import modal
import { useCart } from "../../context/CartContext";
import { orderService } from "../../services/orderService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { menuService } from "../../services/menuService";

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, cartTotal, sessionInfo, clearCart, updateCartItem } = useCart();
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");
    const [editingItem, setEditingItem] = useState(null);

    const navigate = useNavigate();

    const calculateDiscount = (subtotal) => {
        if (subtotal >= 200) return { percentage: 15, amount: subtotal * 0.15 };
        if (subtotal >= 100) return { percentage: 10, amount: subtotal * 0.10 };
        if (subtotal >= 50) return { percentage: 5, amount: subtotal * 0.05 };
        return { percentage: 0, amount: 0 };
    };

    const getNextTierMessage = (subtotal) => {
        if (subtotal < 50) return `Add $${(50 - subtotal).toFixed(2)} for 5% off!`;
        if (subtotal < 100) return `Add $${(100 - subtotal).toFixed(2)} for 10% off!`;
        if (subtotal < 200) return `Add $${(200 - subtotal).toFixed(2)} for 15% off!`;
        return null;
    };

    const discount = calculateDiscount(cartTotal);
    const finalTotal = cartTotal - discount.amount;
    const nextTierMessage = getNextTierMessage(cartTotal);

    // Fetch menu data (có thể dùng chung với MenuPage)
    const { data: menuData } = useQuery({
        queryKey: ['customer-menu', sessionInfo?.restaurant?._id],
        queryFn: () => menuService.getMenu(sessionInfo?.restaurant?._id),
        enabled: !!sessionInfo?.restaurant?._id // Chỉ fetch khi đã có thông tin nhà hàng
    });
    const menuItems = menuData?.items || [];

    const handlePlaceOrder = async () => {
        if (!sessionInfo?.session?._id) return alert("Session expired. Please rescan QR.");
        
        setLoading(true);
        try {
            // Format dữ liệu đúng với Schema OrderItemSchema trong Backend
            const orderData = {
                sessionId: sessionInfo.session._id,
                items: cartItems.map(item => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    // Modifiers là mảng object { name, option, price }
                    modifiers: item.modifiers || [], 
                    note: item.note || ""
                })),
                customerNote: note
            };

            await orderService.placeOrder(orderData);
            
            clearCart(); // Xóa giỏ hàng sau khi đặt thành công
            navigate("/orders"); // Chuyển sang trang theo dõi
        } catch (err) {
            console.error(err);
            alert("Error placing order: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-gray-400">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i className="fa-solid fa-basket-shopping text-4xl text-gray-300"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-600">Your cart is empty</h3>
                <p className="text-sm mb-6">Looks like you haven't added anything yet.</p>
                <button onClick={() => navigate('/menu')} className="px-6 py-3 bg-[#1a1a1a] text-[#D4AF37] rounded-xl font-bold text-sm">
                    Browse Menu
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 pb-32">
            <h2 className="font-momo font-bold text-2xl mb-6 text-[#1a1a1a]">Your Order</h2>
            
            <div className="space-y-5">
                {cartItems.map(item => (
                    <div key={item.uniqueKey} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative">
                        <button onClick={() => removeFromCart(item.uniqueKey)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition">
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                        <button
                            onClick={() => setEditingItem(item)}
                            className="absolute top-4 right-12 text-gray-400 hover:text-blue-500 transition"
                            title="Edit"
                        >
                            <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <div className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                <img src={item.image || "https://via.placeholder.com/100"} className="w-full h-full object-cover" alt={item.name} />
                            </div>
                            <div className="flex-1 pr-6">
                                <h3 className="font-bold text-gray-800">{item.name}</h3>
                                {/* Hiển thị modifiers */}
                                {item.modifiers && item.modifiers.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                        {item.modifiers.map((m, idx) => (
                                            <div key={idx}>+ {m.name}{m.option ? `: ${m.option}` : ""}{m.price ? ` (+$${m.price})` : ""}</div>
                                        ))}
                                    </div>
                                )}
                                {/* Hiển thị note */}
                                {item.note && (
                                    <div className="text-xs text-gray-400 italic mt-1">Note: {item.note}</div>
                                )}
                                <div className="flex justify-between items-center mt-3">
                                    <span className="font-bold text-[#1a1a1a]">${(item.price * item.quantity).toFixed(2)}</span>
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                                        <button onClick={() => updateQuantity(item.uniqueKey, -1)} className="w-7 h-7 flex items-center justify-center font-bold text-gray-600 hover:bg-white rounded-md transition">-</button>
                                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.uniqueKey, 1)} className="w-7 h-7 flex items-center justify-center font-bold text-gray-600 hover:bg-white rounded-md transition">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Note */}
            <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Special Instructions</label>
                <textarea 
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-[#D4AF37]"
                    rows="2"
                    placeholder="E.g. No onions, extra spicy..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                ></textarea>
            </div>

            {/* Total & Checkout */}
            <div className="fixed bottom-[100px] left-6 right-6 bg-[#1a1a1a] p-5 rounded-2xl shadow-2xl text-white z-30">
                <div className="flex justify-between mb-4 items-center">
                    <span className="text-gray-400 text-sm">Total Amount</span>
                    <span className="font-momo font-bold text-2xl text-[#D4AF37]">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full py-3.5 bg-[#D4AF37] text-[#1a1a1a] font-bold rounded-xl hover:bg-[#b5952f] disabled:opacity-70 transition flex justify-center items-center gap-2"
                >
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Place Order"}
                </button>
            </div>

            {/* ProductModal */}
            {editingItem && (
                <ProductModal
                    // Chỉ truyền item gốc (chứa định nghĩa modifiers). 
                    // Do menu chứa full thông tin còn cart item chỉ chứa id, quantity và modifier đã chọn chứ ko chứa full
                    // mà trong product modal cần full lại để edit nên cần lọc lại menu item từ id đó
                    // Nếu không tìm thấy item gốc (do menu chưa load), truyền object tạm để không crash.
                    item={editingItem ? menuItems.find(m => m._id === editingItem.menuItemId) : null}
                    
                    onClose={() => setEditingItem(null)}
                    onAddToCart={(product, quantity, modifiers, note) => {
                        updateCartItem(editingItem.uniqueKey, { quantity, modifiers, note });
                        setEditingItem(null);
                    }}
                    // Truyền các giá trị hiện tại trong giỏ hàng vào đây
                    initialQuantity={editingItem.quantity} // quantity đang chọn
                    initialModifiers={editingItem.modifiers} // modifier đang chọn
                    initialNote={editingItem.note}
                    isEdit
                />
            )}
        </div>
    );
}