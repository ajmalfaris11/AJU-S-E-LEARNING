import mongoose, {Document, Model, Schema} from "mongoose";

// Interface for a comment
interface IComment extends Document {
    user: object,
    comment: string,
}

// Interface for a review
interface IReview extends Document {
    user: object,
    rating: number,
    comment: string,
    commentReplies: IComment[];
}

// Interface for an external resource link
interface ILink extends Document {
    title: string,
    url: string,
}

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
}

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
}
