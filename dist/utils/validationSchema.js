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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newProductSchema = exports.resetPasswordSchema = exports.verifyTokenSchema = exports.newUserSchema = void 0;
const mongoose_1 = require("mongoose");
const yup = __importStar(require("yup"));
const categories_1 = __importDefault(require("./categories"));
const date_fns_1 = require("date-fns");
const emailRegex = /\S+@\S+\.\S+/;
const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;
const tokenAndId = {
    id: yup.string().test({
        name: "valid-id",
        message: "Invalid user id",
        test: (value) => {
            return (0, mongoose_1.isValidObjectId)(value);
        }
    }),
    token: yup.string().required("Token is missing")
};
const password = {
    password: yup.string().required("Password is missing").min(8, "Password should be at least 8 characters long").matches(passwordRegex, "Password should contain at least 1 small letter, one capital letter, and one alphanumeric character")
};
yup.addMethod(yup.string, 'email', function validateEmail(message) {
    return this.matches(emailRegex, {
        message,
        name: 'email',
        excludeEmptyString: true,
    });
});
exports.newUserSchema = yup.object(Object.assign({ name: yup.string().required("Name is missing"), email: yup.string().email("Invalid email").required("Email is missing") }, password));
exports.verifyTokenSchema = yup.object(Object.assign({}, tokenAndId));
exports.resetPasswordSchema = yup.object(Object.assign(Object.assign({}, tokenAndId), password));
exports.newProductSchema = yup.object({
    name: yup.string().required("Name is missing"),
    description: yup.string().required("Description is missing"),
    category: yup.string().oneOf(categories_1.default, "Invalid category").required("Category is missing"),
    price: yup.string().transform((value) => {
        if (isNaN(+value))
            return "";
        return +value;
    }).required("Price is missing"),
    purchasingDate: yup.string().transform((value) => {
        try {
            return (0, date_fns_1.parseISO)(value);
        }
        catch (error) {
            return "";
        }
    }).required("Purchasing date is missing"),
});
