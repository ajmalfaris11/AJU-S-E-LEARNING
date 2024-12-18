import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import LayoutModel from "../models/layout.model";

// create layout function
export const createLayout = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.body;

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
            // Create a new layout entry with FAQ data
            await LayoutModel.create(faq);
        }

        // Handle Categories type layout creation
        if (type === "Catagories") {
            const { catagories } = req.body;
            // Create a new layout entry with categories data
            await LayoutModel.create(catagories);
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
