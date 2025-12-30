import authRouter from "./auth.mjs";
import userRouter from "./user.mjs";
import restaurantRouter from "./restaurant.mjs";
import categoryRouter from "./category.mjs";
import menuRouter from "./menu.mjs";
import tableRouter from "./table.mjs";
import orderRouter from "./order.mjs";
import superAdminRouter from "./superAdmin.mjs";
import staffRouter from "./staff.mjs"; 
import waiterRouter from "./waiter.mjs";
import kitchenRouter from "./kitchen.mjs";
import reviewRouter from "./review.mjs";

export default function route(app) {
    app.use("/api/super/admin", superAdminRouter);

    app.use("/api/auth", authRouter);
    app.use("/api/user", userRouter);
    app.use("/api/restaurant", restaurantRouter);
    app.use("/api/categories", categoryRouter);
    app.use("/api/menu", menuRouter);
    app.use("/api/tables", tableRouter);
    app.use("/api/orders", orderRouter); 
    app.use("/api/staff", staffRouter);
    app.use("/api/waiter", waiterRouter);
    app.use("/api/kitchen", kitchenRouter);
    app.use("/api/reviews", reviewRouter);

    app.use("/api/health", (req, res) => {
        console.log('[PING]');
        res.status(200).send('OK');
    });
}