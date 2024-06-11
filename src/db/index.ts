import { connect } from 'mongoose';

const uri = 'mongodb+srv://oyelowomayowa:UM8biPKwzNxYLHyq@smart-cycle-markets.ahigsc1.mongodb.net/?retryWrites=true&w=majority&appName=smart-cycle-markets'

connect(uri).then(() => {
    console.log("Connection to database successful")
}).catch((err) => {
    console.log("Error connecting to database: ", err.message)
})
