import dotenv from 'dotenv';
import connectDB from "./db/db.js";

dotenv.config({
    path: './env'
})
 
// An async function always returns a promise. so after connectDB .then and .catch is added.
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server running on port: ${process.env.PORT}`);
        
    })
})
.catch((err) => {
    console.log("MongoDB connection lost !!!", err);
    
})













// THIS IS ONE WAY TO CONNECT DB (USED IFFIE TO CALL THE FUNCTION IMMIDIETLY)
/*
import express from 'express'
const app = express()

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on('error', (error) => {
            console.log("App is not listening", error);
            throw error            
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("error", error)
        throw error
    }
})()
    */