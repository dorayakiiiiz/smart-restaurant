import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // Cart lưu trong localStorage để reload không mất
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem("customer_cart");
        return saved ? JSON.parse(saved) : [];
    });

    // Session Info (Lưu thông tin bàn sau khi quét QR)
    const [sessionInfo, setSessionInfo] = useState(() => {
        const saved = localStorage.getItem("session_info");
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        localStorage.setItem("customer_cart", JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        if (sessionInfo) {
            localStorage.setItem("session_info", JSON.stringify(sessionInfo));
        }
    }, [sessionInfo]);

    const addToCart = (product, quantity, modifiers = [], note = "") => {
        setCartItems(prev => {
            // Tạo key unique dựa trên ID món và modifiers (để phân biệt cùng món nhưng khác topping)
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
        }));
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
                        // Nếu modifiers đổi thì cần đổi uniqueKey để tránh trùng
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
            sessionInfo, setSessionInfo
        }}>
            {children}
        </CartContext.Provider>
    );
};