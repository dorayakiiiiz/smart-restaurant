import React, { useEffect, useState } from 'react';
import { linkService } from '../../../services/linkService';
import { shopService } from '../../../services/shopService';
// import { shopService } from '../../../services/shopService';

export default function TrashModal({ onClose, profileId, type = 'link', onRestoreSuccess }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTrash = async () => {
        try {
            setLoading(true);
            if (type === 'link') {
                const { links } = await linkService.getTrashLinks(profileId);
                setItems(links);
            } else if (type === 'shop') {
                const { products } = await shopService.getTrashProducts(profileId);
                setItems(products);
            }
        } catch (err) {
            console.log('Error while fetching trash item: ', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTrash();
    }, [profileId, type]);

    const handleRestore = async (item) => {
        try {
            if (type === 'link') {
                await linkService.restoreLink(item._id);
            } else if (type === 'shop') {
                await shopService.restoreProduct(item._id);
            }

            fetchTrash();
            if (onRestoreSuccess) onRestoreSuccess();
            
        } catch (err) {
            console.log('Error while restoring item: ', err);
        }
    };

    const handleHardDelete = async (itemId) => {
        if (!window.confirm('Delete permanently? This action cannot be undone.')) return;
        try {
            if (type === 'link') {
                await linkService.hardDeleteLink(itemId);
            } else if (type === 'shop') {
                await shopService.hardDeleteProduct(itemId);
            }

            fetchTrash();
        } catch (err) {
            console.log('Error while delete item permanently: ', err);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-300 flex justify-between items-center">
                    <h3 className="font-bold text-xl">Trash Bin ({type === 'link' ? 'Links' : 'Products'})</h3>
                    <button onClick={onClose}><i className="fa-solid fa-xmark text-xl"></i></button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Trash is empty.</div>
                    ) : (
                        <div className="space-y-3">
                            {items.map(item => (
                                <div key={item._id} className="border border-gray-400 rounded-xl p-4 flex justify-between items-center bg-gray-50">
                                    {/* shop -> hiển thị ảnh */}
                                    {type === 'shop' && (
                                        <img src={item.imageUrl} className="w-10 h-10 rounded object-cover border" />
                                    )}
                                    <div className="min-w-0 pr-4">
                                        <div className="font-bold truncate">{item.title || item.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{item.url || item.buyLink}</div>
                                        
                                        {/* Cảnh báo nếu vi phạm */}
                                        {item.isFlagged && (
                                            <div className="text-red-600 text-[10px] font-bold mt-1 flex items-center gap-1">
                                                <i className="fa-solid fa-ban"></i>
                                                Violation Detected (Cannot Restore)
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-2 shrink-0">
                                        <button 
                                            onClick={() => handleRestore(item)}
                                            disabled={item.isFlagged} // Disable nếu vi phạm
                                            className={`p-2 rounded-lg border ${item.isFlagged ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:bg-green-50 text-green-600 border-green-200'}`}
                                            title="Restore"
                                        >
                                            <i className="fa-solid fa-rotate-left"></i>
                                        </button>
                                        <button 
                                            onClick={() => handleHardDelete(item._id)}
                                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                                            title="Delete Permanently"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}