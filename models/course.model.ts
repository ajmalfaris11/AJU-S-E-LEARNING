import mongoose, {Document, Model, Schema} from "mongoose";

// Interface for a question
interface IQuestion extends Document {
    user: object,
    question: string,
    questionReplies:IQuestion[],
}

// Interface for a Comments
interface IComment extends Document {
    user: object,
    comment: string,
    commentReplies:IComment[],
}

// Interface for a review
interface IReview extends Document {
    user: object,
    rating: number,
    comment: string,
    commentReplies: IComment[],
};

// Interface for an external resource link
interface ILink extends Document {
    title: string,
    url: string,
};

// Interface for course content data
interface ICourseData extends Document {
    title: string,
    description: string,
    videoUrl: string,
    videoThumbnail: object,
    videoSection: string,
    videoLength: number,
    videoPlayer: string,
    links: ILink[],
    suggestion: string,
    questions: IComment[],
};

// Interface for the main course model
interface ICourse extends Document {
    name: string,
    description: string,
    price: number,
    estimatePrice?: number,
    thumbnail: object,
    tags: string, 
    level: string,
    demoUrl: string,
    benefits: {title: string}[],
    prerequisites: {title: string}[],
    reviews: IReview[],
    courseData: ICourseData[],
    ratings?: number,
    purchased?: number,
};



//  Breaking the Models in multipel parts to maintain and controll easly
// the course-related data models into separate schemas for better modularity and maintainability.

// Schema for user review on a course
const reviewSchema = new Schema<IReview>({
    user: Object,   // Reference to the user who gave the review
    rating: { 
        type: Number, 
        default: 0,  
    },
    comment: String,  
});

// Schema for external resource link related to the course
const linkSchema = new Schema<ILink>({
    title: String,  
    url: String,    
});

// Schema for a user comment on the course
const QuestionSchema = new Schema<IQuestion>({
    user: Object,  
    question: String,  
    questionReplies: [Object],  // Replies to the comment (can be nested objects)
});

// Schema for course content details, including video and links
const courseDataSchema = new Schema<ICourseData>({
    videoUrl: String,  
    title: String,  
    videoSection: String,  // Section to which the video belongs
    description: String,  
    videoLength: Number,  
    videoPlayer: String,  
    links: [linkSchema],  // List of external resource links
    suggestion: String,  // Additional course suggestions or notes
    questions: [QuestionSchema],  // List of questions related to the content
});

// Main course schema
const courseSchema = new Schema<ICourse>({
    name: {
        type: String,
        required: true,  
    },
    description: {
        type: String,
        required: true,  
    },
    price: {
        type: Number,
        required: true,  
    },
    estimatePrice: {
        type: Number, 
    },
    thumbnail: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    tags: {
        type: String,
        required: true, 
    },
    level: {
        type: String,
        required: true,  
    },
    demoUrl: {
        type: String,
        required: true,  
    },
    benefits: [{ title: String }],  // List of course benefits
    prerequisites: [{ title: String }],  // List of course prerequisites
    reviews: [reviewSchema],  // List of reviews associated with the course
    courseData: [courseDataSchema],  // Detailed content sections of the course
    ratings: {
        type: Number,
        default: 0,  
    },
    purchased: {
        type: Number,
        default: 0, 
    },
});

// Course model based on the defined schema
const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);

export default CourseModel;
