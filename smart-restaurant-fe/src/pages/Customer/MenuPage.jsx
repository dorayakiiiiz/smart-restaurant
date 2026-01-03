import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { menuService } from "../../services/menuService";
import { orderService } from "../../services/orderService";
import { categoryService } from "../../services/categoryService";
import { useCart } from "../../context/CartContext";
import { socket } from "../../services/socket";
import ProductModal from "../../components/Modal/ProductModal"; // Import Modal mới
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";

export default function MenuPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tableToken = searchParams.get("token");
    const { setSessionInfo, addToCart, sessionInfo } = useCart();
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("price-asc"); // State cho sort
    
    // State để quản lý món đang xem
    const [selectedItem, setSelectedItem] = useState(null);

    const handleAddItem = (e, item) => {
        e.stopPropagation();
        if (item.isAvailable)
            setSelectedItem(item);
    }

    const calledRef = useRef(false);

    // 1. Init Session (Chạy 1 lần khi quét QR)
    useEffect(() => {
        const initSession = async () => {
            if (tableToken && !calledRef.current) {
                calledRef.current = true;
                try {
                    // Gọi API startSession để lấy thông tin bàn và session ID
                    const data = await orderService.startSession(tableToken);
                    console.log("Session Started:", data);
                    setSessionInfo(data); // Lưu vào Context -> LocalStorage
                } catch (err) {
                    console.error("Session Start Error:", err);
                    alert("Invalid QR Code or Session Expired");
                }
            }
        };
        // Chỉ chạy khi chưa có session hoặc token thay đổi
        if (tableToken && (!sessionInfo || sessionInfo.session.tableToken !== tableToken)) {
            initSession();
        }
    }, [tableToken]);

    // 2. Socket Connection (Chạy khi đã có Session)
    useEffect(() => {
        if (sessionInfo?.session?._id) {
            // Connect socket nếu chưa connect
            if (!socket.connected) {
                socket.connect();
            }
            
            // Join session room
            socket.emit("join_session", sessionInfo.session._id);
        }

        // Cleanup
        return () => {
            // Không disconnect ở đây để giữ kết nối cho trang Tracking
        };
    }, [sessionInfo]);

    // Lấy ID nhà hàng từ sessionInfo
    const restaurantId = sessionInfo?.restaurant?._id;

    const { data: menuData, isLoading: menuLoading } = useQuery({
        queryKey: ['customer-menu', restaurantId],
        queryFn: () => menuService.getMenu(restaurantId),
        enabled: !!restaurantId // Chỉ gọi khi đã có ID nhà hàng
    });

    const { data: catData, isLoading: catLoading } = useQuery({
        queryKey: ['customer-categories', restaurantId],
        queryFn: () => categoryService.getCategories(restaurantId),
        enabled: !!restaurantId // Chỉ gọi khi đã có ID nhà hàng
    });

    const items = menuData?.items || [];
    const categories = catData?.categories || [];
    
    const fuse = new Fuse(items, {
        keys: ['name'],
        threshold: 0.3
    });

    // fuse trả về object { item, refIndex, score }
    const fuseResults = searchTerm
        ? fuse.search(searchTerm).map(r => r.item)
        : items;

    const filteredItems = fuseResults
        .filter(item => {
            const matchCat = selectedCategory === "all" || item.categoryId._id === selectedCategory;
            return matchCat;
        })
        .sort((a, b) => {
            if (sortBy === 'price-asc') return a.price - b.price;
            if (sortBy === 'price-desc') return b.price - a.price;
            if (sortBy === 'popular') return (b.orderCount || 0) - (a.orderCount || 0);
            return 0;
        });

    if (menuLoading || catLoading) return <div className="p-10 text-center text-[#D4AF37] font-bold">Loading Menu...</div>;

    return (
        <div className="pb-24">
            {/* Search Bar */}
            <div className="sticky top-[83px] z-20 bg-white">

                <div className="px-6 pt-4 pb-4 flex gap-3">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input 
                            type="text" 
                            placeholder="Search for dishes..." 
                            className="w-full bg-gray-100 h-12 rounded-xl pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* Sort Dropdown bổ sung vào bên phải thanh search */}
                    <div className="relative">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="h-12 pl-4 pr-8 bg-gray-100 rounded-xl outline-none text-sm font-bold text-gray-700 appearance-none border-none focus:ring-2 focus:ring-[#D4AF37]/50 transition cursor-pointer"
                        >
                            <option value="popular">Popular</option>
                            <option value="price-asc">Price (Low)</option>
                            <option value="price-desc">Price (High)</option>
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-white/95 backdrop-blur-sm py-2 border-b border-gray-100">
                    <div className="overflow-x-auto flex gap-3 px-6 no-scrollbar pb-2">
                        <button 
                            onClick={() => setSelectedCategory("all")}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${selectedCategory === 'all' ? 'bg-[#1a1a1a] text-[#D4AF37]' : 'bg-white border border-gray-200 text-gray-600'}`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button 
                                key={cat._id}
                                onClick={() => setSelectedCategory(cat._id)}
                                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${selectedCategory === cat._id ? 'bg-[#1a1a1a] text-[#D4AF37]' : 'bg-white border border-gray-200 text-gray-600'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>


            {/* Menu Grid */}
            <div className="p-6 grid grid-cols-1 gap-6">
                {filteredItems.map((item) => (
                    <div 
                        onClick={() => navigate(`/menu/public/${item._id}/${restaurantId}`)}
                        key={item._id} 
                        className={`bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 flex gap-4 relative overflow-hidden group transition active:scale-[0.98] ${!item.isAvailable ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
                    >
                        {/* Image */}
                        <div className="w-28 h-28 bg-gray-100 rounded-xl shrink-0 overflow-hidden relative">
                            {item.images?.[0] ? (
                                <img src={item.images[0].url} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={item.name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><i className="fa-solid fa-image text-2xl"></i></div>
                            )}
                            {!item.isAvailable && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold uppercase">Sold Out</div>
                            )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.name}</h3>
                                    {item.isChefRecommended && <i className="fa-solid fa-crown text-[#D4AF37] text-xs ml-1" title="Chef Recommended"></i>}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 font-medium">{item.description}</p>
                            </div>
                            
                            <div className="flex justify-between items-end mt-3">
                                <span className="font-momo font-bold text-xl text-[#1a1a1a]">${item.price}</span>
                                <button 
                                    onClick={(e) => handleAddItem(e, item)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition ${item.isAvailable ? 'bg-[#D4AF37] text-white' : 'bg-gray-200 text-gray-400'}`}
                                >
                                    <i className="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Product Modal */}
            {selectedItem && (
                <ProductModal 
                    item={selectedItem} 
                    onClose={() => setSelectedItem(null)} 
                    onAddToCart={addToCart} 
                />
            )}
        </div>
    );
}