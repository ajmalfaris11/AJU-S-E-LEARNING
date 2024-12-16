import express from 'express';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';
import { getNotifications } from '../controllers/notification.controller';
const notificationRoute = express.Router();

notificationRoute.get("/get-all-notifications", isAuthenticated, authorizedRoles("admin"), getNotifications)

export default notificationRoute;