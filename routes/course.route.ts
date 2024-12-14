import express from 'express';
import { uploadCourse } from '../controllers/course.controller';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';
const courseRouter = express.Router();

courseRouter.post("/create-course", isAuthenticated, authorizedRoles("admin"), uploadCourse);

export default courseRouter;