import React, { useEffect, useState } from "react";
import { adminService } from "../../../services/adminService";

export default function UserDetailModal({ userId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await adminService.getUserDetails(userId);
                setData(res);
            } catch (err) {
                console.log('Error while fetching user detail data: ', err);
            } finally {
                setLoading(false);
            }
        }
        if (userId) 
            fetchData();
    }, [userId]);

    if (!userId) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold">User Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : data ? (
                        <div className="space-y-6">
                            {/* User Info */}
                            <div className="flex items-center gap-4">
                                <img src={data.profile?.avatarUrl || "/anonymous-avatar.jpg"} className="w-16 h-16 rounded-full border" />
                                <div>
                                    <h3 className="text-lg font-bold">{data.user.displayName}</h3>
                                    <p className="text-gray-500">{data.user.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${data.user.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {data.user.isLocked ? 'LOCKED' : 'ACTIVE'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700">
                                            Violations: {data.user.violationCount || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* history/violation */}
                            <div>
                                {/* Link */}
                                <h4 className="font-bold text-gray-800 mb-3">Link History & Violations</h4>
                                <div className="border rounded-xl overflow-auto max-h-[500px]">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                            <tr>
                                                <th className="px-4 py-3">Link Title</th>
                                                <th className="px-4 py-3">URL</th>
                                                <th className="pl-9 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.links.map(link => (
                                                <tr key={link._id} className={link.isFlagged ? 'bg-red-50' : ''}>
                                                    <td className="px-4 py-3 font-medium">
                                                        {link.title}

                                                        {link.deletedBy === 'admin' && (
                                                            <span className="ml-2 px-2 py-0.5 bg-gray-800 text-white text-[10px] rounded uppercase font-bold">
                                                                Deleted
                                                            </span>
                                                        )}

                                                    </td>
                                                    <td className="px-4 py-3 text-blue-500 truncate max-w-[200px]">
                                                        <a href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
                                                    </td>
                                                    
                                                    <td className="px-4 py-3">
                                                        {link.deletedBy === 'admin' ? (
                                                            <span className="text-gray-600 font-bold text-xs flex items-center gap-1">
                                                                <i className="fa-solid fa-trash-can"></i>
                                                                Removed by Admin
                                                            </span>
                                                        ) : link.isFlagged ? (
                                                            <span className="text-red-600 font-bold text-xs flex items-center gap-1">
                                                                <i className="fa-solid fa-triangle-exclamation"></i>
                                                                {link.violationReason}
                                                            </span>
                                                        ) : (
                                                            <span className="text-green-600 font-bold text-xs">Safe</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {data.links.length === 0 && (
                                                <tr><td colSpan="3" className="p-4 text-center text-gray-500">No links found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Product */}
                                <h4 className="font-bold text-gray-800 my-3">Product History & Violations</h4>
                                <div className="border rounded-xl overflow-auto max-h-[500px]">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                            <tr>
                                                <th className="px-4 py-3">Product Name</th>
                                                <th className="px-4 py-3">Buy Link</th>
                                                <th className="pl-9 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.products && data.products.map(item => (
                                                <tr key={item._id} className={item.isFlagged ? 'bg-red-50' : ''}>
                                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                        <img src={item.imageUrl} className="w-6 h-6 rounded object-cover"/>
                                                        {item.name}
                                                        {item.deletedBy === 'admin' && (
                                                            <span className="ml-2 px-2 py-0.5 bg-gray-800 text-white text-[10px] rounded uppercase font-bold">Deleted</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-blue-500 truncate max-w-[200px]">
                                                        <a href={item.buyLink} target="_blank" rel="noreferrer">{item.buyLink}</a>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {item.deletedBy === 'admin' ? (
                                                            <span className="text-gray-600 font-bold text-xs flex items-center gap-1"><i className="fa-solid fa-trash-can"></i> Removed by Admin</span>
                                                        ) : item.isFlagged ? (
                                                            <span className="text-red-600 font-bold text-xs flex items-center gap-1"><i className="fa-solid fa-triangle-exclamation"></i> {item.violationReason}</span>
                                                        ) : (
                                                            <span className="text-green-600 font-bold text-xs">Safe</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!data.products || data.products.length === 0) && <tr><td colSpan="3" className="p-4 text-center text-gray-500">No products found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-red-500">Failed to load data</div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">Close</button>
                </div>
            </div>
        </div>
    );
}