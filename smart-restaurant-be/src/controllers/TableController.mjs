import Table from "../models/Table.mjs";
import Restaurant from "../models/Restaurant.mjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";

class TableController {
    
    // Helper: Tạo Token JWT cho bàn
    _generateTableToken(tableId, restaurantId) {
        return jwt.sign(
            { tableId, restaurantId, createdAt: Date.now() },
            process.env.JWT_SECRET
        );
    }

    // [GET] /api/tables
    async getTables(req, res) {
        try {
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            // Chỉ lấy bàn chưa bị xóa mềm
            const tables = await Table.find({ 
                restaurantId: restaurant._id,
                isActive: true 
            }).sort({ name: 1 });

            res.status(200).json({ tables });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/tables
    async createTable(req, res) {
        try {
            const { name, capacity, location } = req.body;
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });

            // Check trùng tên
            const existing = await Table.findOne({ 
                restaurantId: restaurant._id, 
                name, 
                isActive: true 
            });
            if (existing) return res.status(400).json({ message: "Table name already exists." });

            // Tạo bàn tạm để lấy ID
            const newTable = new Table({
                restaurantId: restaurant._id,
                name,
                capacity,
                location,
                token: "temp" // Placeholder
            });

            // Sinh token thật dựa trên ID vừa tạo
            newTable.token = this._generateTableToken(newTable._id, restaurant._id);
            await newTable.save();

            res.status(201).json({ message: "Table created", table: newTable });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PUT] /api/tables/:id
    async updateTable(req, res) {
        try {
            const { name, capacity, location } = req.body;
            const table = await Table.findByIdAndUpdate(
                req.params.id,
                { name, capacity, location },
                { new: true }
            );
            res.status(200).json({ message: "Table updated", table });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [DELETE] /api/tables/:id (Soft Delete)
    async deleteTable(req, res) {
        try {
            const table = await Table.findById(req.params.id);
            if (table.status === 'occupied') {
                return res.status(400).json({ message: "Cannot delete occupied table." });
            }
            
            table.isActive = false;
            await table.save();
            
            res.status(200).json({ message: "Table deactivated successfully" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/tables/:id/regenerate
    async regenerateQR(req, res) {
        try {
            const table = await Table.findById(req.params.id);
            if (!table) return res.status(404).json({ message: "Table not found" });

            // Tạo token mới -> Token cũ sẽ vô hiệu (về mặt logic so sánh trong DB)
            table.token = this._generateTableToken(table._id, table.restaurantId);
            await table.save();

            res.status(200).json({ message: "QR Code regenerated", table });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] /api/tables/:id/download-pdf
    async downloadPDF(req, res) {
        try {
            const table = await Table.findById(req.params.id).populate('restaurantId');
            if (!table) return res.status(404).json({ message: "Table not found" });

            const restaurantName = table.restaurantId.name;
            // URL mà khách sẽ quét (Frontend URL)
            const qrData = `${process.env.CLIENT_URL}/menu?table=${table._id}&token=${table.token}`;
            
            // Tạo QR Buffer
            const qrImage = await QRCode.toBuffer(qrData, { width: 300, margin: 2 });

            // Tạo PDF Stream
            const doc = new PDFDocument({ size: 'A5', margin: 50 });
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=QR_${table.name}.pdf`);
            
            doc.pipe(res);

            // --- Vẽ nội dung PDF ---
            // 1. Border trang trí
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#D4AF37');
            
            // 2. Tên nhà hàng
            doc.font('Helvetica-Bold').fontSize(24).fillColor('#1a1a1a').text(restaurantName, { align: 'center' });
            doc.moveDown(0.5);
            
            // 3. Tên bàn
            doc.fontSize(18).fillColor('#D4AF37').text(`TABLE: ${table.name}`, { align: 'center' });
            doc.moveDown(2);

            // 4. Ảnh QR (Căn giữa)
            const qrX = (doc.page.width - 200) / 2;
            doc.image(qrImage, qrX, doc.y, { width: 200 });
            doc.moveDown(12);

            // 5. Hướng dẫn
            doc.font('Helvetica').fontSize(14).fillColor('#555').text('Scan to view menu & order', { align: 'center' });
            
            // 6. Wifi (Optional)
            if (table.restaurantId.wifiPassword) {
                doc.moveDown(1);
                doc.fontSize(12).text(`WiFi Password: ${table.restaurantId.wifiPassword}`, { align: 'center', color: '#888' });
            }

            doc.end();

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Failed to generate PDF" });
        }
    }
}
export default new TableController();