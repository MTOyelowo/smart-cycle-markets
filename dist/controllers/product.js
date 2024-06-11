"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.getProductListings = exports.getLatestProducts = exports.getProductByCategory = exports.getProductDetails = exports.deleteProductImage = exports.deleteProduct = exports.updateProduct = exports.listNewProduct = void 0;
const product_1 = __importDefault(require("../src/models/product"));
const mongoose_1 = require("mongoose");
const cloudinary_1 = __importStar(require("../src/cloudinary"));
const helper_1 = require("../src/utils/helper");
const categories_1 = __importDefault(require("../src/utils/categories"));
const uploadImage = (filepath) => {
    return cloudinary_1.default.upload(filepath, {
        width: 1280,
        height: 720,
        crop: "fill",
    });
};
const listNewProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { name, price, category, description, purchasingDate } = req.body;
    const newProduct = new product_1.default({
        owner: req.user.id, name, price, category, description, purchasingDate
    });
    const { images } = req.files;
    const isMultipleImages = Array.isArray(images);
    let invalidFileType = false;
    if (isMultipleImages && images.length > 5) {
        return (0, helper_1.sendErrorRes)(res, "Image files cannot be more than 5", 422);
    }
    ;
    if (isMultipleImages) {
        for (let image of images) {
            if (!((_a = image.mimetype) === null || _a === void 0 ? void 0 : _a.startsWith("image"))) {
                invalidFileType = true;
                break;
            }
        }
    }
    else {
        if (images) {
            if (!((_b = images.mimetype) === null || _b === void 0 ? void 0 : _b.startsWith("image"))) {
                invalidFileType = true;
            }
        }
    }
    ;
    if (invalidFileType)
        return (0, helper_1.sendErrorRes)(res, "Invalid file type. Files must be image type", 422);
    if (isMultipleImages) {
        const uploadPromise = images.map(file => uploadImage(file.filepath));
        const uploadResults = yield Promise.all(uploadPromise);
        newProduct.images = uploadResults.map(({ secure_url, public_id }) => {
            return { url: secure_url, id: public_id };
        });
        newProduct.thumbnail = newProduct.images[0].url;
    }
    else {
        if (images) {
            const { secure_url, public_id } = yield uploadImage(images.filepath);
            newProduct.images = [{ url: secure_url, id: public_id }];
            newProduct.thumbnail = secure_url;
        }
    }
    yield newProduct.save();
    res.status(201).json({ message: "New product added" });
});
exports.listNewProduct = listNewProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    const { name, price, category, description, purchasingDate, thumbnail } = req.body;
    const productId = req.params.id;
    if (!(0, mongoose_1.isValidObjectId)(productId))
        return (0, helper_1.sendErrorRes)(res, "Invalid product id", 422);
    const product = yield product_1.default.findOneAndUpdate({ _id: productId, owner: req.user.id }, {
        name,
        price,
        category,
        description,
        purchasingDate,
    }, { new: true });
    if (!product)
        return (0, helper_1.sendErrorRes)(res, "Product not found", 404);
    if (typeof thumbnail === "string")
        product.thumbnail = thumbnail;
    const { images } = req.files;
    const isMultipleImages = Array.isArray(images);
    if (isMultipleImages) {
        const oldImages = ((_c = product.images) === null || _c === void 0 ? void 0 : _c.length) || 0;
        if (oldImages + images.length > 5) {
            return (0, helper_1.sendErrorRes)(res, "You can only have 5 images for a product", 422);
        }
    }
    let invalidFileType = false;
    if (isMultipleImages) {
        for (let image of images) {
            if (!((_d = image.mimetype) === null || _d === void 0 ? void 0 : _d.startsWith("image"))) {
                invalidFileType = true;
                break;
            }
        }
    }
    else {
        if (images) {
            if (!((_e = images.mimetype) === null || _e === void 0 ? void 0 : _e.startsWith("image"))) {
                invalidFileType = true;
            }
        }
    }
    ;
    if (invalidFileType)
        return (0, helper_1.sendErrorRes)(res, "Invalid file type. Files must be image type", 422);
    if (isMultipleImages) {
        const uploadPromise = images.map(file => uploadImage(file.filepath));
        const uploadResults = yield Promise.all(uploadPromise);
        const newImages = uploadResults.map(({ secure_url, public_id }) => {
            return { url: secure_url, id: public_id };
        });
        if (product.images)
            product.images.push(...newImages);
        else
            product.images = newImages;
    }
    else {
        if (images) {
            const { secure_url, public_id } = yield uploadImage(images.filepath);
            if (product.images)
                product.images.push({ url: secure_url, id: public_id });
            else
                product.images = [{ url: secure_url, id: public_id }];
        }
    }
    yield product.save();
    res.status(201).json({ message: "Product details updated" });
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productId = req.params.id;
    if (!(0, mongoose_1.isValidObjectId)(productId))
        return (0, helper_1.sendErrorRes)(res, "Invalid product id", 422);
    const product = yield product_1.default.findOneAndDelete({ _id: productId, owner: req.user.id });
    if (!product)
        return (0, helper_1.sendErrorRes)(res, "Product not found", 404);
    const images = product.images || [];
    if (images.length) {
        const imagesIds = images.map(({ id }) => id);
        yield cloudinary_1.cloudApi.delete_resources(imagesIds);
    }
    res.json({ message: "Product removed" });
});
exports.deleteProduct = deleteProduct;
const deleteProductImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const { productId, imageId } = req.params;
    if (!(0, mongoose_1.isValidObjectId)(productId))
        return (0, helper_1.sendErrorRes)(res, "Invalid product id!", 422);
    const product = yield product_1.default.findOneAndUpdate({ _id: productId, owner: req.user.id }, {
        $pull: {
            images: { id: imageId },
        }
    }, { new: true });
    if (!product)
        return (0, helper_1.sendErrorRes)(res, "Product not found!", 422);
    if ((_f = product.thumbnail) === null || _f === void 0 ? void 0 : _f.includes(imageId)) {
        const images = product.images;
        if (images)
            product.thumbnail = images[0].url;
        else
            product.thumbnail = "";
        yield product.save();
    }
    yield cloudinary_1.default.destroy(imageId);
    res.json({ message: "Image deleted" });
});
exports.deleteProductImage = deleteProductImage;
const getProductDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h;
    const { id } = req.params;
    if (!(0, mongoose_1.isValidObjectId)(id))
        return (0, helper_1.sendErrorRes)(res, "Invalid product id", 422);
    const product = yield product_1.default.findById(id).populate("owner");
    if (!product)
        return (0, helper_1.sendErrorRes)(res, "Product not found", 404);
    res.json({
        product: {
            id: product._id,
            name: product.name,
            description: product.description,
            thumbnail: product.thumbnail,
            category: product.category,
            date: product.purchasingDate,
            price: product.price,
            images: (_g = product.images) === null || _g === void 0 ? void 0 : _g.map(image => image.url),
            seller: {
                id: product.owner._id,
                name: product.owner.name,
                avatar: (_h = product.owner.avatar) === null || _h === void 0 ? void 0 : _h.url,
            }
        }
    });
});
exports.getProductDetails = getProductDetails;
const getProductByCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { category } = req.params;
    const { pageNumber = "1", pageSize = "10" } = req.query;
    if (!categories_1.default.includes(category))
        return (0, helper_1.sendErrorRes)(res, "Invalid category", 422);
    const products = yield product_1.default.find({ category })
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
        };
    });
    res.json({ products: listings });
});
exports.getProductByCategory = getProductByCategory;
const getLatestProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield product_1.default.find().sort("-createdAt").limit(10);
    const listings = products.map((product) => {
        return {
            id: product._id,
            name: product.name,
            thumbnail: product.thumbnail,
            category: product.category,
            price: product.price,
            date: product.purchasingDate
        };
    });
    res.json({ products: listings });
});
exports.getLatestProducts = getLatestProducts;
const getProductListings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pageNumber = "1", pageSize = "10" } = req.query;
    const products = yield product_1.default.find({ owner: req.user.id })
        .sort("-createdAt")
        .skip((+pageNumber - 1) * +pageSize)
        .limit(+pageSize);
    const listings = products.map(product => {
        var _a;
        return {
            id: product._id,
            name: product.name,
            thumbnail: product.thumbnail,
            category: product.category,
            price: product.price,
            date: product.purchasingDate,
            images: (_a = product.images) === null || _a === void 0 ? void 0 : _a.map(images => images.url),
            description: product.description,
            seller: {
                id: req.user.id,
                name: req.user.name,
                avatar: req.user.avatar
            }
        };
    });
    res.json({ products: listings });
});
exports.getProductListings = getProductListings;
const searchProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
        return (0, helper_1.sendErrorRes)(res, "Query parameter 'name' is required and must be a string", 400);
    }
    const filter = {};
    if (typeof name === "string" && name.trim() !== "") {
        filter.name = { $regex: new RegExp(name, "i") };
    }
    const products = yield product_1.default.find(filter).limit(50);
    res.json({
        results: products.map((product) => ({
            id: product._id,
            name: product.name,
            thumbnail: product.thumbnail,
        })),
    });
});
exports.searchProducts = searchProducts;
