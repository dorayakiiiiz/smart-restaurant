import { useEffect, useState } from 'react'
import { adminService } from "../../services/adminService";
import AdminTable from "../../components/AdminDashboard/AdminTable";

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay])
    return debouncedValue;
}

export default function ShopManagementPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('all'); 
    const [totalPages, setTotalPages] = useState(1);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, pagination } = await adminService.getProducts({
                page,
                limit: 10,
                search: debouncedSearch,
                status
            });

            setProducts(data);
            setTotalPages(pagination.totalPages);
        } catch (err) {
            console.log('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProducts();
    }, [page, debouncedSearch, status]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status])
    

    const handleResolve = async (product, decision) => {
        let confirmMsg = "";
        if (decision === 'safe') confirmMsg = "Mark this product as SAFE?";
        if (decision === 'banned') confirmMsg = "Delete this product PERMANENTLY?";
        if (decision === 'ban_user') confirmMsg = "⚠️ DANGER: Delete product AND LOCK USER account immediately?";

        if(!window.confirm(confirmMsg)) return;

        try {
            await adminService.resolveProduct(product._id, decision);
            fetchProducts();
        } catch (err) {
            console.log('Error while updating product.')
        }
    }

    const columns = [
        {
            header: "Product Info",
            render: (item) => (
                <div className="flex items-center gap-3 min-w-[250px] max-w-[350px]">
                    <img src={item.imageUrl} className="w-10 h-10 rounded object-cover border bg-gray-100" />
                    <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate" title={item.name}>{item.name}</div>
                        <div className="text-xs text-gray-500 font-bold">${item.price}</div>
                        <a href={item.buyLink} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block">
                            {item.buyLink}
                        </a>
                    </div>
                </div>
            )
        },
        {
            header: "Posted By",
            render: (item) => (
                <div className="flex items-center gap-2 min-w-[200px]">
                    <img src={item.profileId?.avatarUrl || "https://via.placeholder.com/30"} className="w-6 h-6 rounded-full"/>
                    <div className="text-sm">
                        <div className="font-semibold">{item.profileId?.username}</div>
                        <div className="text-xs text-gray-500">{item.profileId?.userId?.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: "AI Detection",
            render: (item) => {
                if (!item.isFlagged) return <span className="text-green-600 text-xs font-bold"><i className="fa-solid fa-check mr-1"></i>Safe</span>;
                return (
                    <div className="flex flex-col min-w-[200px]">
                        <span className="text-red-600 text-xs font-bold uppercase">
                            <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                            {item.violationReason}
                        </span>
                        <span className="text-[10px] text-gray-500">
                            Confidence: {item.violationConfidence}%
                        </span>
                    </div>
                )
            }
        },
        {
            header: "Status",
            render: (item) => (
                <div className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                    item.isFlagged ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                    {item.isFlagged ? 'Hidden (Flagged)' : 'Active'}
                </div>
            )
        }
    ];

    const renderActions = (item) => (
        <div className="flex gap-2">
            {item.isFlagged && (
                <button 
                    onClick={() => handleResolve(item, 'safe')}
                    className="p-2 text-green-600 hover:bg-[#DBFCE7] rounded tooltip"
                    title="Mark as Safe"
                >
                    <i className="fa-solid fa-shield-heart"></i>
                </button>
            )}
            
            <button 
                onClick={() => handleResolve(item, 'banned')}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                title="Delete Product Only"
            >
                <i className="fa-solid fa-trash"></i>
            </button>

            {item.isFlagged && (
                <button 
                    onClick={() => handleResolve(item, 'ban_user')}
                    className="p-2 text-red-600 hover:bg-[#FFE2E2] rounded"
                    title="Delete Product & BAN USER"
                >
                    <i className="fa-solid fa-user-slash"></i>
                </button>
            )}
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col p-6 md:px-[40px] bg-[#f8f9fa]">
            <div className="flex justify-between gap-2 items-center mb-6">
                    {/* Search Input */}
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Filter Select */}
                    <div className="relative">
                        <select 
                            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white cursor-pointer"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="all">All Products</option>
                            <option value="flagged">⚠️ Flagged Violations</option>
                            <option value="safe">✅ Safe Products</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                            <i className="fa-solid fa-angle-down text-xs"></i>
                        </div>
                    </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <AdminTable 
                    columns={columns} 
                    data={products} 
                    isLoading={loading} 
                    actions={renderActions}
                />
            </div>
            
            {/* Pagination */}
             <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <div className="flex gap-4">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
            </div>
        </div>
    );
}