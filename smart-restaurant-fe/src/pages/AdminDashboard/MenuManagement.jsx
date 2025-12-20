
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "../../services/menuService";
import { categoryService } from "../../services/categoryService";
import Button from "../../components/Shared/Button";
import MenuModal from "../../components/Modal/MenuModal";
import CategoryModal from "../../components/Modal/CategoryModal"; 

export default function MenuManagement() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); 
    const [editingItem, setEditingItem] = useState(null); // Món ăn đang chỉnh sửa
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

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
        mutationFn: menuService.createMenuItem,
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

    // 3. Mutations for Category
    const createCategoryMutation = useMutation({
        mutationFn: categoryService.createCategory,
        onSuccess: () => queryClient.invalidateQueries(['categories'])
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: categoryService.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries(['categories']);
            queryClient.invalidateQueries(['menu']); // Refresh menu vì món ăn có thể bị ảnh hưởng
        }
    });

    // Mutation Update Category
    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, name }) => categoryService.updateCategory(id, name),
        onSuccess: () => queryClient.invalidateQueries(['categories'])
    });

    // Handlers
    const handleAddCategory = async (name) => {
        await createCategoryMutation.mutateAsync({ name });
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Delete this category? Items in this category will be uncategorized.")) {
            await deleteCategoryMutation.mutateAsync(id);
        }
    };

    const handleEditCategory = async (id, name) => {
        await updateCategoryMutation.mutateAsync({ id, name });
    };

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

    // Filter Logic
    // menu là object chứa MẢNG items
    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        //categoryId ở đây là object có _id và name
        //Ban đầu all hiển thị tất cả, sau đó so sánh _id
        const matchesCategory = selectedCategory === "All" || (item.categoryId && item.categoryId._id === selectedCategory);
        console.log(selectedCategory, item.categoryId._id)
        return matchesSearch && matchesCategory;
    });

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="p-6 font-quicksand">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-momo text-[#1a1a1a]">Menu Management</h1>
                    <p className="text-gray-500">Organize your menu and categories</p>
                </div>
                <div className="flex gap-3">
                    {/* Nút quản lý category */}
                    <Button 
                        backgrond={{ normal: "#fff", hover: "#f9fafb" }}
                        color="#1a1a1a"
                        text="Manage Categories" 
                        onClick={() => setIsCategoryModalOpen(true)} 
                        className="border border-gray-200"
                    />
                    {/* Nút add menu */}
                    <Button 
                        backgrond={{ normal: "#1a1a1a", hover: "#333" }}
                        color="#fff"
                        text="+ Add Item" 
                        onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col group relative">
                            {/* Image Section */}
                            <div className="h-[180px] rounded-xl bg-gray-100 mb-4 overflow-hidden relative">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                        <i className="fa-solid fa-utensils text-4xl"></i>
                                    </div>
                                )}
                            </div>

                            {/* Title and Status */}
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-lg text-[#1a1a1a] line-clamp-1" title={item.name}>{item.name}</h3>
                                <span 
                                    className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase whitespace-nowrap ${
                                        item.isSoldOut 
                                            ? 'bg-red-50 text-red-500 border border-red-100' 
                                            : (!item.isAvailable 
                                                ? 'bg-gray-100 text-gray-500 border border-gray-200' 
                                                : 'bg-green-50 text-green-600 border border-green-100')
                                    }`}
                                >
                                    {item.isSoldOut ? 'Sold Out' : (!item.isAvailable ? 'Unavailable' : 'Available')}
                               </span>
                            </div>

                            {/* Category */}
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                                {item.categoryId?.name || 'Uncategorized'}
                            </p>

                            {/* Description */}
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-[40px]">{item.description}</p>

                            {/* Price and Prep Time */}
                            <div className="flex justify-between items-center mb-3">
                                <div className="text-xl font-bold text-red-500">
                                    ${item.price.toFixed(2)}
                                </div>
                                <div className="flex items-center text-gray-400 text-sm">
                                    <i className="fa-regular fa-clock mr-1"></i>
                                    <span>{item.prepTime || 15} min</span>
                                </div>
                            </div>

                            {/* Rating and Orders (Mock data for now) */}
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                <i className="fa-solid fa-star text-yellow-400 mr-1"></i>
                                <span className="font-bold text-gray-700 mr-1">4.5</span>
                                <span className="text-gray-400 mr-3">(32)</span>
                                <span>76 orders</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
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

            {isCategoryModalOpen && (
                <CategoryModal
                    onClose={() => setIsCategoryModalOpen(false)}
                    categories={categories}
                    onAdd={handleAddCategory}
                    onDelete={handleDeleteCategory}
                    onEdit={handleEditCategory}
                />
            )}
        </div>
    );
}