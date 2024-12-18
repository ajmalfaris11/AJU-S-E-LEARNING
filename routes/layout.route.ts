import express from 'express';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';
import { createLayout } from '../controllers/layout.controller';
const layoutRoute = express.Router();

layoutRoute.post("/create-layout", isAuthenticated, authorizedRoles("admin"), createLayout);

export default layoutRoute;