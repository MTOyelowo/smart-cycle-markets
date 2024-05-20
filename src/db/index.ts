import { connect } from 'mongoose';

const uri = 'mongodb://localhost:27017/smart-cycle-market'

connect(uri).then(() => {
    console.log("Connection to database successful")
}).catch((err) => {
    console.log("Error connecting to database: ", err.message)
})
