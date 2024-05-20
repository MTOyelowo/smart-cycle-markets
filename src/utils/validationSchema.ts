import { isValidObjectId } from "mongoose";
import * as yup from "yup";
import categories from "./categories";
import { parseISO } from "date-fns";

const emailRegex = /\S+@\S+\.\S+/;
const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;

const tokenAndId = {
    id: yup.string().test({
        name: "valid-id",
        message: "Invalid user id",
        test: (value) => {
            return isValidObjectId(value)
        }
    }),
    token: yup.string().required("Token is missing")
};

const password = {
    password: yup.string().required("Password is missing").min(8, "Password should be at least 8 characters long").matches(passwordRegex, "Password should contain at least 1 small letter, one capital letter, and one alphanumeric character")
}

// declare module 'yup' {
//     interface StringSchema {
//         password(message: string): StringSchema;
//     }
// }

yup.addMethod(yup.string, 'email', function validateEmail(message) {
    return this.matches(emailRegex, {
        message,
        name: 'email',
        excludeEmptyString: true,
    });
});

// yup.addMethod(yup.string, 'password', function validatePassword(message) {
//     return this.matches(passwordRegex, {
//         message,
//         name: 'password',
//         excludeEmptyString: true,
//     });
// });

export const newUserSchema = yup.object({
    name: yup.string().required("Name is missing"),
    email: yup.string().email("Invalid email").required("Email is missing"),
    ...password,
});

export const verifyTokenSchema = yup.object({
    ...tokenAndId,
});

export const resetPasswordSchema = yup.object({
    ...tokenAndId,
    ...password,

});

export const newProductSchema = yup.object({
    name: yup.string().required("Name is missing"),
    description: yup.string().required("Description is missing"),
    category: yup.string().oneOf(categories, "Invalid category").required("Category is missing"),
    price: yup.string().transform((value) => {
        if (isNaN(+value)) return ""
        return +value
    }).required("Price is missing"),
    purchasingDate: yup.string().transform((value) => {
        try {
            return parseISO(value)
        } catch (error) {
            return ""
        }

    }).required("Purchasing date is missing"),

})