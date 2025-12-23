import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "../../../services/menuService";
import Button from "../../../components/Shared/Button";

export default function MenuTrashModal({ onClose }) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['menu', 'trash'],
        queryFn: menuService.getTrashMenu
    });

    const items = data?.items || [];

    const restoreMutation = useMutation({
        mutationFn: menuService.restoreMenuItem,
        onSuccess: () => {
            queryClient.invalidateQueries(['menu']);
            queryClient.invalidateQueries(['menu', 'trash']);
            onClose();
        }
    });

    const forceDeleteMutation = useMutation({
        mutationFn: menuService.forceDeleteMenuItem,
        onSuccess: () => {
            queryClient.invalidateQueries(['menu', 'trash']);
            onClose();
        }
    });

    if (isLoading) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">Loading...</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-red-600">Trash Bin (Menu Items)</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">🗑️</div>
                        <p className="text-gray-500">Trash is empty</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                    <th className="p-3 border-b font-medium">Image</th>
                                    <th className="p-3 border-b font-medium">Name</th>
                                    <th className="p-3 border-b font-medium">Category</th>
                                    <th className="p-3 border-b font-medium">Price</th>
                                    <th className="p-3 border-b font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 border-b">
                                            <img 
                                                src={item.images?.[0]?.url || item.imageUrl || "https://via.placeholder.com/40"} 
                                                alt={item.name} 
                                                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                            />
                                        </td>
                                        <td className="p-3 border-b font-medium text-gray-800">{item.name}</td>
                                        <td className="p-3 border-b text-gray-500 text-sm">{item.categoryId?.name || 'N/A'}</td>
                                        <td className="p-3 border-b font-medium text-gray-800">${item.price}</td>
                                        <td className="p-3 border-b text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    backgrond={{ normal: "#E5E7EB", hover: "#D1D5DB" }}
                                                    color="#111827"
                                                    text={restoreMutation.isPending ? "..." : "Restore"}
                                                    onClick={() => restoreMutation.mutate(item._id)}
                                                    disabled={restoreMutation.isPending}
                                                    className="!px-4 !py-2 !text-xs !rounded-lg"
                                                />
                                                <Button 
                                                    backgrond={{ normal: "#FEE2E2", hover: "#FECACA" }}
                                                    color="#DC2626"
                                                    text={forceDeleteMutation.isPending ? "..." : "Delete"}
                                                    onClick={() => {
                                                        if (window.confirm("Permanently delete this item? This cannot be undone.")) {
                                                            forceDeleteMutation.mutate(item._id);
                                                        }
                                                    }}
                                                    disabled={forceDeleteMutation.isPending}
                                                    className="!px-4 !py-2 !text-xs !rounded-lg"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                <div className="mt-6 flex justify-end pt-4 border-t">
                    <Button 
                        backgrond={{ normal: "#f3f4f6", hover: "#e5e7eb" }}
                        color="#4b5563"
                        text="Close"
                        onClick={onClose}
                    />
                </div>
            </div>
        </div>
    );
}