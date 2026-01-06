import { useState } from "react";
import QRCode from "react-qr-code"; // Cần cài: npm install react-qr-code
import { tableService } from "../../services/tableService";

export default function QRModal({ table, onClose, onRegenerate }) {
    const [loading, setLoading] = useState(false);
    
    // URL mà khách sẽ quét
    const qrValue = `${import.meta.env.VITE_CLIENT_URL}/menu?table=${table._id}&token=${table.token}`;
    console.log(import.meta.env.VITE_CLIENT_URL)
    console.log(qrValue)

    const handleDownloadPDF = async () => {
        setLoading(true);
        try {
            await tableService.downloadPDF(table._id, table.name);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPNG = async () => {
        setLoading(true);
        try {
            await tableService.downloadPNG(table._id, table.name);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        if(!window.confirm("Warning: The old QR code will stop working immediately. Continue?")) return;
        
        setLoading(true);
        try {
            await onRegenerate(table._id);
            onClose(); // Đóng để refresh lại data ở trang chủ
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                
                {/* Left: QR Display */}
                <div className="bg-[#1a1a1a] p-8 flex flex-col items-center justify-center text-white md:w-5/12">
                    <div className="bg-white p-4 rounded-xl mb-4">
                        <QRCode value={qrValue} size={160} />
                    </div>
                    <h3 className="font-momo text-2xl text-[#D4AF37] font-bold mb-1">{table.name}</h3>
                    <p className="text-gray-400 text-sm">{table.location}</p>
                </div>

                {/* Right: Info & Actions */}
                <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-xl font-bold text-gray-800">QR Code Management</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-black"><i className="fa-solid fa-xmark text-xl"></i></button>
                    </div>

                    <div className="space-y-4 flex-1">
                        <div className="flex justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-500 text-sm">Status</span>
                            <span className={`font-bold text-sm ${table.status === 'free' ? 'text-green-600' : 'text-red-600'}`}>
                                {table.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-500 text-sm">Capacity</span>
                            <span className="font-bold text-sm text-gray-800">{table.capacity} Seats</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-gray-100">
                            <span className="text-gray-500 text-sm">Last Updated</span>
                            <span className="font-bold text-sm text-gray-800">{new Date(table.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={handleDownloadPDF}
                                disabled={loading}
                                className="py-3 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold rounded-xl flex items-center justify-center gap-2 transition text-sm"
                            >
                                <i className="fa-solid fa-file-pdf"></i> PDF
                            </button>
                            <button 
                                onClick={handleDownloadPNG}
                                disabled={loading}
                                className="py-3 bg-gray-800 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 transition text-sm"
                            >
                                <i className="fa-solid fa-image"></i> PNG
                            </button>
                        </div>

                        <button 
                            onClick={handleRegenerate}
                            disabled={loading}
                            className="w-full py-3 border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold rounded-xl flex items-center justify-center gap-2 transition"
                        >
                            <i className="fa-solid fa-rotate"></i>
                            Regenerate QR Code
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}