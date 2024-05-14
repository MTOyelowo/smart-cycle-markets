import "dotenv/config";
import 'express-async-errors';
import 'src/db';
import express from 'express';
import authRouter from 'routes/auth';
import productRouter from "./routes/products";

const app = express();

app.use(express.static("src/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use('/auth', authRouter);
app.use('/product', productRouter);

app.use(function (err, req, res, next) {
    res.status(500).json({ message: err.message })
} as express.ErrorRequestHandler)

app.listen(8000, () => {
    console.log("The app is running on http://localhost:8000")
});


//Uploading file to local directory

// app.post("/upload-file", async (req, res) => {
//     const form = formidable({
//         uploadDir: path.join(__dirname, "public"),
//         filename(name, ext, part, form) {
//             return Date.now() + "_" + part.originalFilename;
//         },
//     });
//     await form.parse(req);
//     res.send("ok");
// });