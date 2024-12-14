import express from 'express';
import { editCourse, getAllCourse, getSingleCourse, uploadCourse } from '../controllers/course.controller';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';
const courseRouter = express.Router();

courseRouter.post("/create-course", isAuthenticated, authorizedRoles("admin"), uploadCourse);
courseRouter.post("/edit-course/:id", isAuthenticated, authorizedRoles("admin"), editCourse);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-courses", getAllCourse);


export default courseRouter;