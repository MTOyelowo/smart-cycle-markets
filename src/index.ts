import express, { RequestHandler } from 'express';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.listen(8000, () => {
    console.log("The app is running on http://localhost:8000")
});