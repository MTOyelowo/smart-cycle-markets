"use strict";
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
const formidable_1 = __importDefault(require("formidable"));
const fileParser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const form = (0, formidable_1.default)();
    const [fields, files] = yield form.parse(req);
    if (!req.body)
        req.body = {};
    for (let key in fields) {
        req.body[key] = fields[key][0];
    }
    if (!req.files)
        req.files = {};
    for (let key in files) {
        const actualFiles = files[key];
        if (!actualFiles)
            break;
        if (actualFiles.length > 1) {
            req.files[key] = actualFiles;
        }
        else {
            req.files[key] = actualFiles[0];
        }
    }
    next();
});
exports.default = fileParser;
