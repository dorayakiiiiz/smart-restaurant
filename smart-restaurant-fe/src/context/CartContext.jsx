import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { socket } from "../services/socket";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // Cart lưu trong localStorage để reload không mất
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem("customer_cart");
        return saved ? JSON.parse(saved) : [];
    });

    // Session Info (Lưu thông tin bàn sau khi quét QR)
    const [sessionInfo, _setSessionInfo] = useState(() => {
        const saved = localStorage.getItem("session_info");
        return saved ? JSON.parse(saved) : null;
    });

    // State để hiển thị màn hình Thank You
    const [showThankYou, setShowThankYou] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState(null);

    useEffect(() => {
        localStorage.setItem("customer_cart", JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        if (sessionInfo) {
            localStorage.setItem("session_info", JSON.stringify(sessionInfo));
        } else {
            localStorage.removeItem("session_info");
        }
    }, [sessionInfo]);

    // Wrapper để xử lý logic khi session thay đổi (VD: quét QR bàn khác)
    const setSessionInfo = (newSessionData) => {
        const oldSessionId = sessionInfo?.session?._id;
        const newSessionId = newSessionData?.session?._id;

        if (newSessionId) {
            if (oldSessionId !== newSessionId) {
                console.log("New session detected, clearing old cart");
                setCartItems([]);
            }
        }
        
        _setSessionInfo(newSessionData);
    };

    const { user } = useAuth();

    // --- Lắng nghe sự kiện kết thúc session ---
    useEffect(() => {
        if (sessionInfo?.session?._id) {
            // Đảm bảo socket đã connect
            if (!socket.connected) {
                socket.connect();
            }
            
            // Join room session
            socket.emit("join_session", sessionInfo.session._id);

            // Hàm xử lý khi nhận tín hiệu kết thúc
            const handleSessionEnded = (data) => {
                console.log("Session ended event received:", data);
                
                // Nếu là payment completed, hiện màn hình Thank You
                if (data?.reason === 'payment_completed') {
                    setPaymentMethod(data?.method || 'unknown');
                    setShowThankYou(true);
                    
                    // Sau 5 giây, xóa session và redirect
                    setTimeout(() => {
                        localStorage.removeItem("session_info");
                        localStorage.removeItem("customer_cart");
                        setCartItems([]);
                        _setSessionInfo(null);
                        setShowThankYou(false);
                        

                        if (user)
                            window.location.href = "/profile";
                        else
                            window.location.href = "/menu";
                    }, 5000);
                } else {
                    // Các trường hợp khác (admin kết thúc session, etc.)
                    localStorage.removeItem("session_info");
                    localStorage.removeItem("customer_cart");
                    setCartItems([]);
                    _setSessionInfo(null);
                }
            };

            // Lắng nghe
            socket.on("session_ended", handleSessionEnded);

            // Cleanup
            return () => {
                socket.off("session_ended", handleSessionEnded);
            };
        }
    }, [sessionInfo?.session?._id]); 
    // ---------------------------------------------------------

    const addToCart = (product, quantity, modifiers = [], note = "") => {
        setCartItems(prev => {
            const uniqueKey = `${product._id}-${JSON.stringify(modifiers)}`;
            
            const existing = prev.find(item => item.uniqueKey === uniqueKey);
            
            if (existing) {
                return prev.map(item => 
                    item.uniqueKey === uniqueKey 
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            
            return [...prev, {
                uniqueKey,
                menuItemId: product._id,
                name: product.name,
                price: product.price,
                image: product.images?.[0]?.url,
                quantity,
                modifiers,
                note
            }];
        });
    };

    const removeFromCart = (uniqueKey) => {
        setCartItems(prev => prev.filter(item => item.uniqueKey !== uniqueKey));
    };

    const updateQuantity = (uniqueKey, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.uniqueKey === uniqueKey) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const clearCart = () => setCartItems([]);

    const updateCartItem = (uniqueKey, { quantity, modifiers, note }) => {
        setCartItems(prev =>
            prev.map(item =>
                item.uniqueKey === uniqueKey
                    ? {
                        ...item,
                        quantity: quantity ?? item.quantity,
                        modifiers: modifiers ?? item.modifiers,
                        note: note ?? item.note,
                        uniqueKey: `${item.menuItemId}-${JSON.stringify(modifiers ?? item.modifiers)}`
                    }
                    : item
            )
        );
    };

    // Tính tổng tiền giỏ hàng
    const cartTotal = cartItems.reduce((total, item) => {
        const modifiersPrice = item.modifiers.reduce((acc, mod) => acc + mod.price, 0);
        return total + (item.price + modifiersPrice) * item.quantity;
    }, 0);

    return (
        <CartContext.Provider value={{
            cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal,
            updateCartItem,
            sessionInfo, setSessionInfo,
            showThankYou, paymentMethod // Export để CustomerLayout có thể hiển thị
        }}>
            {children}
        </CartContext.Provider>
    );
};