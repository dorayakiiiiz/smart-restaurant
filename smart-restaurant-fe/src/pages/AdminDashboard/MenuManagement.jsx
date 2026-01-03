
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "../../services/menuService";
import { categoryService } from "../../services/categoryService";
import Button from "../../components/Shared/Button";
import MenuModal from "../../components/Modal/MenuModal";
import { useNavigate } from "react-router-dom";
import MenuTrashModal from "./Modal/MenuTrashModal";
import Fuse from "fuse.js";

export default function MenuManagement() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTrashOpen, setIsTrashOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // Món ăn đang chỉnh sửa
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [status, setStatus] = useState("All");
    const [sortBy, setSortBy] = useState("newest");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // 1. Fetch Data
    // Lấy menu items khi cache bị invalidated
    const { data: menuData, isLoading: isMenuLoading } = useQuery({
        queryKey: ['menu'],
        queryFn: menuService.getMenu
    });

    const { data: categoryData, isLoading: isCategoryLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryService.getCategories
    });

    //Lấy dữ liệu hoặc mảng rỗng nếu chưa có
    const menuItems = menuData?.items || [];
    const categories = categoryData?.categories || [];
    const isLoading = isMenuLoading || isCategoryLoading;

    // 2. Mutations for Menu
    const createMenuMutation = useMutation({
        mutationFn: (data) => menuService.createMenuItem(data),
        onSuccess: () => queryClient.invalidateQueries(['menu'])
    });

    const updateMenuMutation = useMutation({
        mutationFn: ({ id, data }) => menuService.updateMenuItem(id, data),
        onSuccess: () => queryClient.invalidateQueries(['menu'])
    });

    const deleteMenuMutation = useMutation({
        mutationFn: menuService.deleteMenuItem,
        onSuccess: () => queryClient.invalidateQueries(['menu'])
    });

    const handleSaveMenu = async (formData) => {
        if (editingItem) {
            await updateMenuMutation.mutateAsync({ id: editingItem._id, data: formData });
        } else {
            await createMenuMutation.mutateAsync(formData);
        }
    };

    const handleDeleteMenu = async (id) => {
        if (window.confirm("Delete this item?")) {
            await deleteMenuMutation.mutateAsync(id);
        }
    };

    //Handle status text
    const handleStatusText = (item) => {
        if (!item.isAvailable) return 'Unavailable';
        if (item.isSoldOut) return 'Sold out';
        return 'Available';
    }


    const fuse = new Fuse(menuItems, {
        keys: ['name'],
        threshold: 0.3
    });

    // fuse trả về object { item, refIndex, score }
    const fuseResults = searchTerm
        ? fuse.search(searchTerm).map(r => r.item)
        : menuItems;

    // Filter Logic
    // menu là object chứa MẢNG items
    const filteredItems = fuseResults.filter(item => {
        //categoryId ở đây là object có _id và name
        //Ban đầu all hiển thị tất cả, sau đó so sánh _id
        //Filter category
        const matchesCategory = selectedCategory === "All" || (item.categoryId && item.categoryId._id === selectedCategory);
        //Filter status
        const matchesStatus = status === "All" || handleStatusText(item) === status;
        return matchesCategory && matchesStatus;
    });

    filteredItems.sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortBy === 'low') {
            return a.price - b.price;
        }
        else if (sortBy === 'high') {
            return b.price - a.price;
        }
        //TO DO: Cần có trường orders trong menuItem để sắp xếp đúng
        else if (sortBy === 'popular') {
            return b.price - a.price; // Assuming 'orders' field indicates popularity
        }
        return 0;
    });

    // Pagination Logic
    //Để khi thay đổi bộ lọc thì trở về trang 1, đảm bảo không bị lỗi render dựa vào
    //currentPage
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, status, sortBy]);

    //Tính toán pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );


    if (isLoading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="font-quicksand">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-momo text-[#1a1a1a]">Menu</h1>
                    <p className="text-gray-500">Organize your menu and categories</p>
                </div>
                <div className="flex gap-3">
                    {/* Nút add menu */}
                    <Button 
                        backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                        color="#fff"
                        text="+ Add Item" 
                        onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                    />
                    {/* Nút trash */}
                    <Button 
                        backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                        color="#fff"
                        text="Trash Bin"    
                        onClick={() => {setIsTrashOpen(true)}} 
                    />
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-4 mb-8 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Search menu items..."
                            className="w-full h-[50px] rounded-xl bg-white pl-10 pr-4 outline-none border border-gray-200 focus:border-[#D4AF37] transition-colors"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status option */}
                <select
                    className="h-[50px] rounded-xl bg-white px-4 outline-none border border-gray-200 focus:border-[#D4AF37] cursor-pointer min-w-[150px]"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option  value='Available'>Available</option>
                    <option  value='Unavailable'>Unavailable</option>
                    <option  value='Sold out'>Sold out</option>
                </select>

                {/* Category option */}
                <select
                    className="h-[50px] rounded-xl bg-white px-4 outline-none border border-gray-200 focus:border-[#D4AF37] cursor-pointer min-w-[150px]"
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                >
                    <option value="All">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                </select>

                {/* Sort by option */}
                <select
                    className="h-[50px] rounded-xl bg-white px-4 outline-none border border-gray-200 focus:border-[#D4AF37] cursor-pointer min-w-[150px]"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                >
                    <option value="newest">Sort by: Newest</option>
                    <option  value='low'>Sort by: Price (Low)</option>
                    <option  value='high'>Sort by: Price (High)</option>
                    <option  value='popolar'>Sort by: Popular</option>
                </select>
            </div>

            {/* Menu Grid */}

            {/* Nếu lọc ra không có item nào hợp thì để trống */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No items found</h3>
                    <p className="text-gray-500">Try adjusting your search or add a new item.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedItems.map(item => (
                            <div key={item._id} 
                                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col group relative h-full"
                            >
                                <div onClick={() => navigate(`/system/admin/menu/${item._id}`)}>
                                    {/* Image Section */}
                                    <div className="h-[180px] rounded-xl bg-gray-100 mb-4 overflow-hidden relative shrink-0">
                                        {item.images && item.images.length > 0 ? (
                                            <img
                                                src={
                                                    item.images.find(img => img.isPrimary)?.url 
                                                    || item.images[0].url
                                                }
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                <i className="fa-solid fa-utensils text-4xl"></i>
                                            </div>
                                        )}
                                        
                                        {/* Chef Recommendation Badge - Góc trên phải */}
                                        {item.isChefRecommended && (
                                            <div className="absolute top-2 right-2 bg-[#D4AF37] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 z-10">
                                                <i className="fa-solid fa-hat-chef"></i>
                                                <span>Chef's Choice</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Container - Flex grow để đẩy nút xuống dưới cùng */}
                                    <div className="flex flex-col flex-grow">
                                        {/* Title and Status */}
                                        <div className="flex justify-between items-start mb-1 gap-2">
                                            <h3 className="font-bold text-lg text-[#1a1a1a] line-clamp-2 h-[56px] leading-tight" title={item.name}>
                                                {item.name}
                                            </h3>
                                            <span 
                                                className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase whitespace-nowrap shrink-0 ${
                                                    item.isSoldOut 
                                                        ? 'bg-red-50 text-red-500 border border-red-100' 
                                                        : (!item.isAvailable 
                                                            ? 'bg-gray-100 text-gray-500 border border-gray-200' 
                                                            : 'bg-green-50 text-green-600 border border-green-100')
                                                }`}
                                            >
                                                {item.isSoldOut ? 'Sold Out' : (!item.isAvailable || !item.categoryId?.isActive ? 'Unavailable' : 'Available')}
                                            </span>
                                        </div>

                                        {/* Category */}
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                                            {(item.categoryId?.name || 'Uncategorized')}
                                        </p>

                                        {/* Description - Fixed height */}
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-[40px] overflow-hidden">
                                            {item.description || "No description available."}
                                        </p>

                                        {/* Price and Prep Time */}
                                        <div className="flex justify-between items-center mb-3 mt-auto">
                                            <div className="text-xl font-bold text-red-500">
                                                ${item.price.toFixed(2)}
                                            </div>
                                            <div className="flex items-center text-gray-400 text-sm">
                                                <i className="fa-regular fa-clock mr-1"></i>
                                                <span>{item.prepTime || 15} min</span>
                                            </div>
                                        </div>

                                        {/* Rating and Orders */}
                                        <div className="flex items-center text-sm text-gray-500 mb-4">
                                            <i className="fa-solid fa-star text-yellow-400 mr-1"></i>
                                            <span className="font-bold text-gray-700 mr-1">4.5</span>
                                            <span className="text-gray-400 mr-3">(32)</span>
                                            <span>76 orders</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons - Luôn ở dưới cùng */}
                                <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                                    {/* Edit button */}
                                    <button 
                                        onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                        className="flex-1 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-[#1a1a1a] hover:text-white font-medium text-sm transition-all"
                                    >
                                        <i className="fa-solid fa-pen"></i>
                                    </button>
                                    <button 
                                        className="flex-1 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-[#1a1a1a] hover:text-white font-medium text-sm transition-all"
                                        title="Duplicate"
                                    >
                                        <i className="fa-regular fa-copy"></i>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteMenu(item._id)}
                                        className="flex-1 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                                    currentPage === 1 
                                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-[#1a1a1a]'
                                }`}
                            >
                                <i className="fa-solid fa-chevron-left text-xs"></i>
                                <span>Previous</span>
                            </button>

                            <span className="text-sm font-medium text-gray-600">
                                Page <span className="text-[#1a1a1a] font-bold">{currentPage}</span> of {totalPages}
                            </span>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                                    currentPage === totalPages 
                                        ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-[#1a1a1a]'
                                }`}
                            >
                                <span>Next</span>
                                <i className="fa-solid fa-chevron-right text-xs"></i>
                            </button>
                        </div>
                    )}           
                </>
            )}

            {/* Modals */}
            {isModalOpen && (
                <MenuModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSaveMenu}
                    initialData={editingItem}
                    categories={categories}
                />
            )}

            {isTrashOpen && (
                <MenuTrashModal 
                    onClose={() => setIsTrashOpen(false)}
                />
            )}
        </div>
    );
}