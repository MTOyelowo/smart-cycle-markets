import { UploadApiResponse } from "cloudinary";
import { RequestHandler } from "express";
import ProductModel, { ProductDocument } from "../models/product";
import { isValidObjectId } from "mongoose";
import cloudUploader, { cloudApi } from "../cloudinary";
import { UserDocument } from "../models/user";
import { sendErrorRes } from "../utils/helper";
import categories from "../utils/categories";
import { FilterQuery } from "mongoose";

const uploadImage = (filepath: string): Promise<UploadApiResponse> => {
    return cloudUploader.upload(filepath, {
        width: 1280,
        height: 720,
        crop: "fill",
    })
}

export const listNewProduct: RequestHandler = async (req, res) => {
    const { name, price, category, description, purchasingDate } = req.body;
    const newProduct = new ProductModel({
        owner: req.user.id, name, price, category, description, purchasingDate
    });

    const { images } = req.files;
    const isMultipleImages = Array.isArray(images);
    let invalidFileType = false;

    if (isMultipleImages && images.length > 5) {
        return sendErrorRes(res, "Image files cannot be more than 5", 422)
    };

    if (isMultipleImages) {
        for (let image of images) {
            if (!image.mimetype?.startsWith("image")) {
                invalidFileType = true;
                break;
            }
        }
    } else {
        if (images) {
            if (!images.mimetype?.startsWith("image")) {
                invalidFileType = true;
            }
        }
    };

    if (invalidFileType) return sendErrorRes(res, "Invalid file type. Files must be image type", 422);

    if (isMultipleImages) {
        const uploadPromise = images.map(file => uploadImage(file.filepath));
        const uploadResults = await Promise.all(uploadPromise);

        newProduct.images = uploadResults.map(({ secure_url, public_id }) => {
            return { url: secure_url, id: public_id }
        });

        newProduct.thumbnail = newProduct.images[0].url
    } else {
        if (images) {
            const { secure_url, public_id } = await uploadImage(images.filepath);

            newProduct.images = [{ url: secure_url, id: public_id }]

            newProduct.thumbnail = secure_url;
        }
    }

    await newProduct.save()

    res.status(201).json({ message: "New product added" })
};

export const updateProduct: RequestHandler = async (req, res) => {

    const { name, price, category, description, purchasingDate, thumbnail } = req.body;

    const productId = req.params.id
    if (!isValidObjectId(productId)) return sendErrorRes(res, "Invalid product id", 422);

    const product = await ProductModel.findOneAndUpdate({ _id: productId, owner: req.user.id },
        {
            name,
            price,
            category,
            description,
            purchasingDate,
        },
        { new: true });

    if (!product) return sendErrorRes(res, "Product not found", 404);

    if (typeof thumbnail === "string") product.thumbnail = thumbnail;

    const { images } = req.files;

    const isMultipleImages = Array.isArray(images);

    // if (product.images.length >= 5) {
    //     return sendErrorRes(res, "Product already has 5 images", 422)
    // };

    if (isMultipleImages) {
        const oldImages = product.images?.length || 0
        if (oldImages + images.length > 5) {
            return sendErrorRes(res, "You can only have 5 images for a product", 422)
        }
    }

    let invalidFileType = false;

    if (isMultipleImages) {
        for (let image of images) {
            if (!image.mimetype?.startsWith("image")) {
                invalidFileType = true;
                break;
            }
        }
    } else {
        if (images) {
            if (!images.mimetype?.startsWith("image")) {
                invalidFileType = true;
            }
        }
    };

    if (invalidFileType) return sendErrorRes(res, "Invalid file type. Files must be image type", 422);

    if (isMultipleImages) {
        const uploadPromise = images.map(file => uploadImage(file.filepath));
        const uploadResults = await Promise.all(uploadPromise);

        const newImages = uploadResults.map(({ secure_url, public_id }) => {
            return { url: secure_url, id: public_id }
        });

        if (product.images) product.images.push(...newImages)
        else product.images = newImages
    } else {
        if (images) {
            const { secure_url, public_id } = await uploadImage(images.filepath);
            if (product.images) product.images.push({ url: secure_url, id: public_id });
            else product.images = [{ url: secure_url, id: public_id }]
        }
    }

    await product.save()

    res.status(201).json({ message: "Product details updated" })
};

export const deleteProduct: RequestHandler = async (req, res) => {
    const productId = req.params.id;

    if (!isValidObjectId(productId)) return sendErrorRes(res, "Invalid product id", 422);

    const product = await ProductModel.findOneAndDelete({ _id: productId, owner: req.user.id })

    if (!product) return sendErrorRes(res, "Product not found", 404);

    const images = product.images || []
    if (images.length) {
        const imagesIds = images.map(({ id }) => id)
        await cloudApi.delete_resources(imagesIds)
    }

    res.json({ message: "Product removed" })
}

export const deleteProductImage: RequestHandler = async (req, res) => {
    const { productId, imageId } = req.params;

    if (!isValidObjectId(productId)) return sendErrorRes(res, "Invalid product id!", 422)

    const product = await ProductModel.findOneAndUpdate({ _id: productId, owner: req.user.id }, {
        $pull: {
            images: { id: imageId },
        }
    }, { new: true });

    if (!product) return sendErrorRes(res, "Product not found!", 422)

    if (product.thumbnail?.includes(imageId)) {
        const images = product.images
        if (images) product.thumbnail = images[0].url
        else product.thumbnail = "";
        await product.save();
    }

    await cloudUploader.destroy(imageId)

    res.json({ message: "Image deleted" })
}

export const getProductDetails: RequestHandler = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendErrorRes(res, "Invalid product id", 422);

    const product = await ProductModel.findById(id).populate<{ owner: UserDocument }>("owner")
    if (!product) return sendErrorRes(res, "Product not found", 404);

    res.json({
        product: {
            id: product._id,
            name: product.name,
            description: product.description,
            thumbnail: product.thumbnail,
            category: product.category,
            date: product.purchasingDate,
            price: product.price,
            images: product.images?.map(image => image.url),
            seller: {
                id: product.owner._id,
                name: product.owner.name,
                avatar: product.owner.avatar?.url,
            }
        }
    })
}

export const getProductByCategory: RequestHandler = async (req, res) => {
    const { category } = req.params
    const { pageNumber = "1", pageSize = "10" } = req.query as { pageNumber: string, pageSize: string };

    if (!categories.includes(category)) return sendErrorRes(res, "Invalid category", 422);



    const products = await ProductModel.find({ category })
        .sort("-createdAt")
        .skip((+pageNumber - 1) * +pageSize)
        .limit(+pageSize);
    const listings = products.map(product => {
        return {
            id: product._id,
            name: product.name,
            thumbnail: product.thumbnail,
            category: product.category,
            price: product.price,
            date: product.purchasingDate
        }
    })

    res.json({ products: listings })
}

export const getLatestProducts: RequestHandler = async (req, res) => {
    const products = await ProductModel.find().sort("-createdAt").limit(10);

    const listings = products.map((product) => {
        return {
            id: product._id,
            name: product.name,
            thumbnail: product.thumbnail,
            category: product.category,
            price: product.price,
            date: product.purchasingDate
        }
    });

    res.json({ products: listings })

}

export const getProductListings: RequestHandler = async (req, res) => {
    const { pageNumber = "1", pageSize = "10" } = req.query as { pageNumber: string, pageSize: string };

    const products = await ProductModel.find({ owner: req.user.id })
        .sort("-createdAt")
        .skip((+pageNumber - 1) * +pageSize)
        .limit(+pageSize);

    const listings = products.map(product => {
        return {
            id: product._id,
            name: product.name,
            thumbnail: product.thumbnail,
            category: product.category,
            price: product.price,
            date: product.purchasingDate,
            images: product.images?.map(images => images.url),
            description: product.description,
            seller: {
                id: req.user.id,
                name: req.user.name,
                avatar: req.user.avatar

            }
        }
    })

    res.json({ products: listings })
}

export const searchProducts: RequestHandler = async (req, res) => {
    const { name } = req.query;

    if (!name || typeof name !== 'string') {
        return sendErrorRes(res, "Query parameter 'name' is required and must be a string", 400);
    }

    const filter: FilterQuery<ProductDocument> = {};

    if (typeof name === "string" && name.trim() !== "") {

        filter.name = { $regex: new RegExp(name, "i") };
    }

    const products = await ProductModel.find(filter).limit(50);

    res.json({
        results: products.map((product) => ({
            id: product._id,
            name: product.name,
            thumbnail: product.thumbnail,
        })),
    });
}