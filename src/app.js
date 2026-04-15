import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



// Router import 
import { router as userRoutes } from './routes/user.routes.js'
import { router as VideoRoutes } from './routes/video.routes.js'
import { router as SubscriptionRoutes } from './routes/subscriptions.routes.js'
import { router as PlaylistRoutes } from './routes/playlist.routes.js'

// Router declaration
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/videos", VideoRoutes)
app.use("api/v1/subscription", SubscriptionRoutes)
app.use("api/v1/playlist", PlaylistRoutes)


export default app;