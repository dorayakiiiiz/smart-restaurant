import Table from "../models/Table.mjs";
import Restaurant from "../models/Restaurant.mjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import archiver from "archiver"; 

// Helper: Tạo Token JWT cho bàn
const generateTableToken = (tableId, restaurantId) => {
    return jwt.sign(
        { tableId, restaurantId, createdAt: Date.now() },
        process.env.JWT_SECRET
    );
}

class TableController {
    
    // [GET] /api/tables
    async getTables(req, res) {
        try {
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

            const tables = await Table.find({ 
                restaurantId: restaurant._id
            }).sort({ name: 1 });

            //Tất cả bàn của nhà hàng
            res.status(200).json({ tables });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/tables
    //Chỉ admin (chủ quán) mới được tạo bàn
    async createTable(req, res) {
        try {
            const { name, capacity, location, description } = req.body;
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            if (!restaurant) return res.status(404).json({ message: "Restaurant not found." });
            
            // Check trùng tên
            const existing = await Table.findOne({ restaurantId: restaurant._id, name });
            if (existing) return res.status(400).json({ message: "Table name already exists." });
            
            // Tạo bàn tạm để lấy ID
            const newTable = new Table({
                restaurantId: restaurant._id,
                name,
                capacity,
                location,
                description,
                token: "temp" // Placeholder
            });
            
            // Sinh token thật dựa trên ID vừa tạo
            newTable.token = generateTableToken(newTable._id, restaurant._id);
            await newTable.save();

            res.status(201).json({ message: "Table created", table: newTable });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PUT] /api/tables/:id
    async updateTable(req, res) {
        try {
            const { name, capacity, location, description } = req.body;
            const table = await Table.findByIdAndUpdate(
                req.params.id,
                { name, capacity, location, description },
                { new: true }
            );
            res.status(200).json({ message: "Table updated", table });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [PATCH] /api/tables/:id/toggle-active
    async toggleActive(req, res) {
        try {
            const table = await Table.findById(req.params.id);
            if (!table) return res.status(404).json({ message: "Table not found" });

            if (table.status === 'occupied' && table.isActive) {
                return res.status(400).json({ message: "Cannot deactivate an occupied table." });
            }

            table.isActive = !table.isActive; // Đảo ngược trạng thái
            await table.save();

            const msg = table.isActive ? "Table activated" : "Table deactivated";
            res.status(200).json({ message: msg, table });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [DELETE] /api/tables/:id 
    async deleteTable(req, res) {
        try {
            const table = await Table.findById(req.params.id);
            if (!table) return res.status(404).json({ message: "Table not found" });

            if (table.status === 'occupied') {
                return res.status(400).json({ message: "Cannot delete occupied table." });
            }
            
            // Xóa thật khỏi DB
            await Table.findByIdAndDelete(req.params.id);
            
            res.status(200).json({ message: "Table deleted permanently" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/tables/:id/regenerate
    async regenerateQR(req, res) {
        try {
            const table = await Table.findById(req.params.id);
            if (!table) return res.status(404).json({ message: "Table not found" });

            // Tạo token mới -> Token   cũ sẽ vô hiệu (về mặt logic so sánh trong DB)
            table.token = generateTableToken(table._id, table.restaurantId);
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

    // [GET] /api/tables/:id/download-png (MỚI)
    async downloadPNG(req, res) {
        try {
            const table = await Table.findById(req.params.id);
            if (!table) return res.status(404).json({ message: "Table not found" });

            const qrData = `${process.env.CLIENT_URL}/menu?table=${table._id}&token=${table.token}`;
            
            // Trả về image stream
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename=QR_${table.name}.png`);
            
            await QRCode.toFileStream(res, qrData, { width: 400, margin: 2 });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [GET] /api/tables/batch/download-zip (MỚI - Tải tất cả QR dạng ZIP)
    // async downloadBatchZIP(req, res) {
    //     try {
    //         const restaurant = await Restaurant.findOne({ adminId: req.user.id });
    //         const tables = await Table.find({ restaurantId: restaurant._id, isActive: true });

    //         if (tables.length === 0) return res.status(400).json({ message: "No tables found" });

    //         const archive = archiver('zip', { zlib: { level: 9 } });

    //         res.setHeader('Content-Type', 'application/zip');
    //         res.setHeader('Content-Disposition', `attachment; filename=All_QRs_${restaurant.slug}.zip`);

    //         archive.pipe(res);

    //         for (const table of tables) {
    //             const qrData = `${process.env.CLIENT_URL}/menu?table=${table._id}&token=${table.token}`;
    //             const buffer = await QRCode.toBuffer(qrData, { width: 400 });
    //             archive.append(buffer, { name: `QR_${table.name}.png` });
    //         }

    //         await archive.finalize();
    //     } catch (err) {
    //         console.error(err);
    //         res.status(500).json({ error: "Failed to create ZIP" });
    //     }
    // }


    // [GET] /api/tables/batch/download-zip
    async downloadBatchZIP(req, res) {
        try {
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            const tables = await Table.find({ restaurantId: restaurant._id });

            if (tables.length === 0) return res.status(400).json({ message: "No tables found" });

            // 1. TẠO DỮ LIỆU TRƯỚC (Quan trọng: Tránh lỗi async khi đang pipe stream)
            const qrFiles = await Promise.all(tables.map(async (table) => {
                const qrData = `${process.env.CLIENT_URL}/menu?table=${table._id}&token=${table.token}`;
                const buffer = await QRCode.toBuffer(qrData, { width: 400, margin: 1 });
                // Xử lý tên file an toàn
                const safeName = table.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                return { name: `QR_${safeName}.png`, buffer };
            }));

            // 2. Thiết lập Header
            const filename = `All_QRs_${restaurant.slug || 'restaurant'}.zip`;
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // 3. Nén và gửi
            const archive = archiver('zip', { zlib: { level: 9 } });
            
            archive.on('error', (err) => {
                console.error("Archiver error:", err);
                if (!res.headersSent) res.status(500).send({ error: err.message });
            });

            archive.pipe(res);

            qrFiles.forEach(file => {
                archive.append(file.buffer, { name: file.name });
            });

            await archive.finalize();

        } catch (err) {
            console.error("ZIP Error:", err);
            if (!res.headersSent) res.status(500).json({ error: "Failed to create ZIP" });
        }
    }

    // [GET] /api/tables/batch/download-pdf
    async downloadBatchPDF(req, res) {
        try {
            const restaurant = await Restaurant.findOne({ adminId: req.user.id });
            const tables = await Table.find({ restaurantId: restaurant._id }).sort({ name: 1 });

            if (tables.length === 0) return res.status(400).json({ message: "No tables found" });

            // 1. TẠO DỮ LIỆU TRƯỚC
            const tablesWithQR = await Promise.all(tables.map(async (table) => {
                const qrData = `${process.env.CLIENT_URL}/menu?table=${table._id}&token=${table.token}`;
                const qrBuffer = await QRCode.toBuffer(qrData, { width: 300, margin: 1 });
                return { ...table.toObject(), qrBuffer };
            }));

            // 2. Thiết lập PDF Stream
            const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: false });
            
            const filename = `All_Tables_${restaurant.slug || 'restaurant'}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            doc.pipe(res);

            // 3. Vẽ PDF (Dữ liệu đã có sẵn, chạy đồng bộ an toàn)
            tablesWithQR.forEach((table) => {
                doc.addPage();
                
                // Border
                doc.rect(20, 20, 555, 800).stroke('#D4AF37');
                
                // Content
                doc.font('Helvetica-Bold').fontSize(30).fillColor('#1a1a1a').text(restaurant.name, { align: 'center', mt: 50 });
                doc.moveDown();
                doc.fontSize(24).fillColor('#D4AF37').text(`TABLE: ${table.name}`, { align: 'center' });
                
                // QR Image
                doc.image(table.qrBuffer, (doc.page.width - 300) / 2, 200, { width: 300 });
                
                doc.fontSize(16).fillColor('#555').text('Scan to order', 0, 520, { align: 'center' });
                if(table.description) {
                    doc.moveDown(0.5);
                    doc.fontSize(12).text(table.description, { align: 'center' });
                }
            });

            doc.end();

        } catch (err) {
            console.error("Batch PDF Error:", err);
            if (!res.headersSent) res.status(500).json({ error: "Failed to generate Batch PDF" });
        }
    }
}
export default new TableController();