"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const categories_1 = __importDefault(require("../src/utils/categories"));
const schema = new mongoose_1.Schema({
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        enum: [...categories_1.default],
        required: true,
    },
    purchasingDate: {
        type: Date,
        required: true,
    },
    images: [{
            type: Object,
            url: String,
            id: String
        }],
    thumbnail: String,
}, { timestamps: true });
const ProductModel = (0, mongoose_1.model)("Product", schema);
exports.default = ProductModel;
