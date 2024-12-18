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

const faqSchema = new Schema<FaqItem> ({
    question: {type: String},
    answer: {type: String},
});

const categorySchema = new Schema<Category>({
    title: {type: String},
});

const bannerImageSchema = new Schema<BannerImage>({
    public_id: {type: String},
    url:{type:String},
});

const layoutSchema = new Schema<Layout>({
    type: {type:String},
    faq: [faqSchema],
    catagories: [categorySchema],
    banner:{
    image: bannerImageSchema,
    title:{type:String},
    subTitle: {type:String},
    },
});

const LayoutModel = model<Layout>('Layout', layoutSchema);

export default LayoutModel;