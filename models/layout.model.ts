import { Schema, model, Document } from "mongoose";

// Interface for FAQ Item
interface FaqItem extends Document {
    question: string;
    answer: string;
}

// Interface for Category
interface Category extends Document {
    title: string;
}

// Interface for Banner Image
interface BannerImage extends Document {
    public_id: string;
    url: string;
}

// Interface for Layout
interface Layout extends Document {
    type: string;
    faq: FaqItem[];
    catagories: Category[];
    banner: {
        image: BannerImage;
        title: string;
        subTitle: string;
    };
}
