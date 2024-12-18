import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import LayoutModel from "../models/layout.model";

// create layout function
export const createLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        const isTypeExist = await LayoutModel.findOne({type});

        if(isTypeExist){
            return next(new ErrorHandler(`${type} already exist`, 400))
        }

        // Handle Banner type layout creation
        if (type === "Banner") {
            const { image, title, subTitle } = req.body;

            // Upload the image to Cloudinary
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "Layout",  // Specify the folder in Cloudinary
            });

            // Define the banner object with image URL and public ID
            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,  // Get the secure URL of the uploaded image
                },
                title,  // Banner title
                subTitle,  // Banner subtitle
            };

            // Create a new layout entry with the banner data
            await LayoutModel.create(banner);
        }

        // Handle FAQ type layout creation
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = await Promise.all(
                faq.map(async(item:any) => {
                    return {
                        question: item.question,
                        answer: item.answer,
                    }
                })
            )
            // Create a new layout entry with FAQ data
            await LayoutModel.create({type:"FAQ", faq:faqItems});
        }

        // Handle Categories type layout creation
        if (type === "Catagories") {
            const { catagories } = req.body;

            const catagoryItems = await Promise.all(
                catagories.map(async(item:any) => {
                    return {
                       title: item.title,
                    }
                })
            )

            // Create a new layout entry with categories data
            await LayoutModel.create({type:"Catagories", catagories:catagoryItems});
        }

        // Return success response
        res.status(200).json({
            success: true,
            message: "Layout created successfully",  // Message indicating successful creation
        });

    } catch (error: any) {
        // Error handling, return an error response if any occurs
        return next(new ErrorHandler(error.message, 500));
    }
});

// Update Layout
export const editLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

        // Handle Banner type layout update
        if (type === "Banner") {
            const bannerData:any = await LayoutModel.findOne({type:"Banner"});
            const { image, title, subTitle } = req.body;

            // Delete old banner image if it exists
            if(bannerData){
                await cloudinary.v2.uploader.destroy(bannerData?.image.public_id);
            };

            // Upload new banner image to Cloudinary
            const myCloud = await cloudinary.v2.uploader.upload(image, {
                folder: "Layout",  
            });

            // Define new banner data
            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,  
                },
                title,  
                subTitle,  
            };

            // Update the banner data in the database
            await LayoutModel.findByIdAndUpdate(bannerData._id, {banner});
        }

        // Handle FAQ type layout update
        if (type === "FAQ") {
            const faqData:any = await LayoutModel.findOne({type:"FAQ"});
            const { faq } = req.body;

            // Prepare updated FAQ entries
            const faqItems = await Promise.all(
                faq.map(async(item:any) => ({
                    question: item.question,
                    answer: item.answer,
                }))
            );

            // Update FAQ entries in the database
            await LayoutModel.findByIdAndUpdate(faqData?._id, {type:"FAQ", faq:faqItems});
        }

        // Handle Categories type layout update
        if (type === "Catagories") {
            const { catagories } = req.body;
            const catagoryData = await LayoutModel.findOne({type:"Catagories"});

            // Prepare updated category entries
            const catagoryItems = await Promise.all(
                catagories.map(async(item:any) => ({
                    title: item.title,
                }))
            );

            // Update categories in the database
            await LayoutModel.findByIdAndUpdate(catagoryData?._id, {type:"Catagories", catagories:catagoryItems});
        }

        // Return success response
        res.status(200).json({
            success: true,
            message: "Layout Updated successfully",  
        });

    } catch (error: any) {
        // Handle and return error response
        return next(new ErrorHandler(error.message, 500));
    }
});


export const getLayoutByType = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {type} = req.body;
        const layout = await LayoutModel.findOne({type});
        // Return success response
        res.status(200).json({
            success: true,
            layout,
        });

    } catch (error:any) {
        return next(new ErrorHandler(error.message, 500));
    }
})
