import express from 'express';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';
import { getNotifications, updateNotication } from '../controllers/notification.controller';
const notificationRoute = express.Router();

notificationRoute.get("/get-all-notifications", isAuthenticated, authorizedRoles("admin"), getNotifications)
notificationRoute.put("/update-notification/:id", isAuthenticated, authorizedRoles("admin"), updateNotication)

export default notificationRoute;