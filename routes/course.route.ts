import express from 'express';
import { addQueston, addReplayToReview, addReview, answerQuestion, deleteCourse, editCourse, getAllCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse } from '../controllers/course.controller';
import { authorizedRoles, isAuthenticated } from '../middleware/auth';
const courseRouter = express.Router();

courseRouter.post("/create-course", isAuthenticated, authorizedRoles("admin"), uploadCourse);
courseRouter.post("/edit-course/:id", isAuthenticated, authorizedRoles("admin"), editCourse);
courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-courses", getAllCourse);

courseRouter.get("/get-course-content/:id",isAuthenticated, getCourseByUser);

courseRouter.put("/add-question",isAuthenticated, addQueston);
courseRouter.put("/add-answer",isAuthenticated, answerQuestion);

courseRouter.put("/add-review/:id",isAuthenticated, addReview);
courseRouter.put("/add-replay-review",isAuthenticated, authorizedRoles("admin"), addReplayToReview);

courseRouter.get("/get-courses",isAuthenticated,authorizedRoles("admin"), getAllCourses);

courseRouter.delete("/delete-course/:id",isAuthenticated,authorizedRoles("admin"), deleteCourse);



export default courseRouter;