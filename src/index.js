import dotenv from 'dotenv';
import connectDB from "./db/db.js";

dotenv.config({
    path: './env'
})
 

connectDB();




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