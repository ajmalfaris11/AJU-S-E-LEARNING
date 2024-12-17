import express from 'express';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';
import { createOrder, getAllOrders } from '../controllers/order.controller';
const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);

orderRouter.get("/get-orders",isAuthenticated,authorizedRoles("admin"), getAllOrders);

export default orderRouter;