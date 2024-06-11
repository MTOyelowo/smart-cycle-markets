"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudApi = void 0;
const cloudinary_1 = require("../cloudinary");
const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME;
const CLOUDINARY_KEY = process.env.CLOUDINARY_KEY;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_SECRET;
cloudinary_1.v2.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_SECRET,
    secure: true,
});
const cloudUploader = cloudinary_1.v2.uploader;
exports.cloudApi = cloudinary_1.v2.api;
exports.default = cloudUploader;
