import "dotenv/config";
import 'express-async-errors';
import 'src/db';
import express from 'express';
import http from "http";
import authRouter from 'routes/auth';
import productRouter from "./routes/products";
import { sendErrorRes } from "./utils/helper";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: "/socket-message"
})

app.use(express.static("src/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use('/auth', authRouter);
app.use('/product', productRouter);

//Socket IO
io.on("connection", (socket) => {
    console.log("user is connected")
})

app.use(function (err, req, res, next) {
    res.status(500).json({ message: err.message })
} as express.ErrorRequestHandler)

app.use("*", (req, res) => {
    sendErrorRes(res, "Not Found", 404);
})

server.listen(8000, () => {
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