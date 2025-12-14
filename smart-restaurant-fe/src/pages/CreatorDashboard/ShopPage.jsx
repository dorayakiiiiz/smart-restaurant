import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useShop } from "../../context/ShopContext";
import { useProfile } from "../../context/ProfileContext";
import { useState } from "react";
import { UserInfo } from "../../components/CreatorDashboard/UserInfo";
import QuickActions from "../../components/CreatorDashboard/QuickActions";
import ShopModal from "./Modal/ShopModal";
import DeleteModal from "../../components/Modal/DeleteModal";
import TrashModal from "../AdminDashboard/Modal/TrashModal";

export default function ShopPage() {
    const { products, fetchProducts, updateProduct, removeProduct, reorderProducts, loadingProducts } = useShop();

    const { profile } = useProfile();
    
    const [isShopModalOpen, setIsShopModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [isTrashOpen, setIsTrashOpen] = useState(false); 

    const handleOpenAdd = () => {
        setEditingProduct(null);
        setIsShopModalOpen(true);
    };

    const handleOpenEdit = (product) => {
        setEditingProduct(product);
        setIsShopModalOpen(true);
    };

    const handleCloseShop = () => {
        setIsShopModalOpen(false);
        setEditingProduct(null);
    };

    const handleOpenDelete = (id) => {
        setIsDeleteModalOpen(true);
        setDeleteId(id);
    };

    const handleCloseDelete = () => {
        setIsDeleteModalOpen(false);
        setDeleteId(null);
    };

    const handleToggleEnable = (product) => {
        updateProduct(product._id, { isEnable: !product.isEnable });
    };

    const onDragEnd = (result) => {
        if (!result.destination || result.destination.index === result.source.index) return;
        reorderProducts(result.source.index, result.destination.index);
    };

    const ProductSkeleton = () => (
        <div className="bg-white px-4 py-6 rounded-xl shadow-md border border-gray-100 flex items-center gap-4 animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0"></div>
            <div className="grow">
                <div className="flex justify-between mb-4">
                    <div className="space-y-2 w-3/4">
                        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="w-10 h-6 bg-gray-200 rounded-full"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col">
            {isShopModalOpen && (
                <ShopModal editingProduct={editingProduct} onClose={handleCloseShop} />
            )}

            {isDeleteModalOpen && (
                <DeleteModal 
                    deleteId={deleteId} 
                    onClose={handleCloseDelete} 
                    removeFunc={removeProduct}
                    confirmMessage="Are you sure to delete this product?"
                    successLog="Product deleted successfully."
                />
            )}

            {isTrashOpen && (
                <TrashModal 
                    isOpen={isTrashOpen} 
                    onClose={() => setIsTrashOpen(false)}
                    profileId={profile?._id}
                    type='shop'
                    onRestoreSuccess={fetchProducts}
                />
            )}


            <div className="flex-1 p-6 md:px-[10px] lg:px-[20px] xl:px-[60px]">
                <div className="max-w-3xl mx-auto w-full">
                    <UserInfo />

                    <div className="my-6">
                        <div className="w-full">
                            <button
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-10 rounded-full font-medium transition"
                                onClick={handleOpenAdd}
                            >
                                + Add product
                            </button>
                        </div>
                    </div>

                    <div 
                        className="flex justify-end"
                        onClick={() => setIsTrashOpen(true)}
                    >
                        <div className="flex justify-center cursor-pointer shadow gap-2 items-center border border-gray-300 px-4 py-2 rounded-lg mr-2 bg-gray-100 hover:bg-[#fff]">
                            <div>
                                View trash bin
                            </div>
                            <div className="flex justify-center items-center text-gray-500">
                                <i className="fa-regular fa-trash-can text-xl"></i>
                            </div>
                        </div>
                    </div>

                    <div className="w-full my-4">
                        {loadingProducts && (
                            <div className="space-y-4 pr-2">
                                <ProductSkeleton />
                                <ProductSkeleton />
                                <ProductSkeleton />
                            </div>
                        )}

                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="products-list">
                                {(provided) => (
                                    <div
                                        className="space-y-4 pr-2"
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                    >
                                        {!loadingProducts &&
                                            products &&
                                            products.length > 0 &&
                                            products.map((product, index) => {
                                                if (!product) return null;

                                                return (
                                                    <Draggable
                                                        key={product._id}
                                                        draggableId={product._id}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                                                }}
                                                                className="bg-white px-4 py-5 rounded-3xl shadow-md flex items-center gap-4"
                                                            >

                                                                <div className="grow min-w-0">
                                                                    <div className="flex justify-between items-stretch">
                                                                        <div className="flex items-center gap-4 grow min-w-0 pr-4">
                                                                            
                                                                            <div className="shrink-0">
                                                                                {product.imageUrl ? (
                        
                                                                                    <div className="ml-[6px] relative">
                                                                                        <img
                                                                                            src={product.imageUrl}
                                                                                            alt={product.name}
                                                                                            className="w-[100px] h-[100px] object-cover rounded-lg"
                                                                                        />
                                                                                        <div 
                                                                                            className="absolute -top-[4px] -left-[4px] rounded-full w-[30px] h-[30px] bg-[#F1F0EE] flex items-center justify-center"
                                                                                            title="Move"
                                                                                            {...provided.dragHandleProps}
                                                                                        >
                                                                                            <i className="fa-solid fa-arrows-up-down-left-right text-[#4f4f4f]"></i>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                                                        <i className="fa-solid fa-image text-gray-400 text-xl"></i>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="grow min-w-0">
                                                                                <div className="flex items-center mb-1">
                                                                                    <span className="font-bold">{product.name}</span>
                                                                                </div>

                                                                                <div className="text-purple-600 font-semibold mb-1">
                                                                                    ${product.price}
                                                                                </div>

                                                                                <a
                                                                                    href={product.buyLink}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-sm text-blue-600 hover:text-blue-500 mb-3 truncate block mr-[20px]"
                                                                                >
                                                                                    {product.buyLink}
                                                                                </a>

                                                                                {product.isFlagged && (
                                                                                    <div className="my-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-3">
                                                                                        <i className="fa-solid fa-triangle-exclamation text-red-600 mt-0.5 text-sm"></i>
                                                                                        <div>
                                                                                            <p className="font-bold text-red-700">Violation Detected</p>
                                                                                            <p className="text-[12px] text-red-600">
                                                                                                Reason: {product.violationReason}. This product is disabled.
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                
                                                                                <div className="flex items-center space-x-3 gap-2 text-gray-500">
                                                                                    <i
                                                                                        className="fa-solid fa-star text-base hover:text-gray-700 cursor-pointer"
                                                                                        title="Favourite"
                                                                                    ></i>
                                                                                    <i
                                                                                        className="fa-solid fa-lock text-base hover:text-gray-700 cursor-pointer"
                                                                                        title="Lock"
                                                                                    ></i>
                                                                                    <i
                                                                                        className="fa-regular fa-chart-bar text-base hover:text-gray-700 cursor-pointer"
                                                                                        title="Analytics"
                                                                                    ></i>
                                                                                </div>
                                                                            </div>

                                                                        </div>

                                                                        <div className=" flex flex-col justify-between items-center">
                                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="sr-only peer"
                                                                                    checked={product.isEnable}
                                                                                    disabled={product.isFlagged}
                                                                                    onChange={() => handleToggleEnable(product)}
                                                                                />
                                                                                <div
                                                                                    className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"
                                                                                    title="Enable/Disable"
                                                                                ></div>
                                                                            </label>
                                                                            <div className="flex items-center justify-center gap-[6px]">
                                                                                <div>

                                                                                    <i
                                                                                        title="Edit"
                                                                                        className="fa-solid fa-pen text-gray-500 text-lg hover:text-[#47B6FF] cursor-pointer"
                                                                                        onClick={() => handleOpenEdit(product)}
                                                                                    ></i>
                                                                                </div>

                                                                                <div>
                                                                                    <i
                                                                                        title="Delete"
                                                                                        className="fa-solid fa-trash-can text-gray-500 text-lg hover:text-red-500 cursor-pointer"
                                                                                        onClick={() => handleOpenDelete(product._id)}
                                                                                    ></i>
                                                                                </div>
                                                                            </div>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        {!loadingProducts && products && products.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                You don't have any products yet. Click "+ Add product" to create one.
                            </div>
                        )}

                        <QuickActions />
                    </div>
                </div>
            </div>
        </div>
    );
}