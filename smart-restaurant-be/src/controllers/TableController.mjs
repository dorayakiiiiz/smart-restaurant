import Table from "../models/Table.mjs";
import Restaurant from "../models/Restaurant.mjs";
import crypto from "crypto";

class TableController {
    // [GET] /api/tables
    async getTables(req, res) {
        try {
            const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
            const tables = await Table.find({ restaurantId: restaurant._id });
            res.status(200).json({ tables });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [POST] /api/tables
    async createTable(req, res) {
        try {
            const { name, capacity } = req.body;
            const restaurant = await Restaurant.findOne({ ownerId: req.user.id });

            // Tạo token ngẫu nhiên cho QR
            const token = crypto.randomBytes(16).toString("hex");

            const table = await Table.create({
                restaurantId: restaurant._id,
                name,
                capacity,
                token
            });

            res.status(201).json({ table });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    // [DELETE] /api/tables/:id
    async deleteTable(req, res) {
        try {
            await Table.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Table deleted" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
export default new TableController();