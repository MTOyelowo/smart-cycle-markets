"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const uri = 'mongodb+srv://oyelowomayowa:UM8biPKwzNxYLHyq@smart-cycle-markets.ahigsc1.mongodb.net/?retryWrites=true&w=majority&appName=smart-cycle-markets';
(0, mongoose_1.connect)(uri).then(() => {
    console.log("Connection to database successful");
}).catch((err) => {
    console.log("Error connecting to database: ", err.message);
});
