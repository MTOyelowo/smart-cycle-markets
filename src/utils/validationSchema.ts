import * as yup from "yup";

const emailRegex = /\S+@\S+\.\S+/;
const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;

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
    password: yup.string().required("Password is missing").min(8, "Password should be at least 8 characters long").matches(passwordRegex, "Password should contain at least 1 small letter, one capital letter, and one alphanumeric character")
});