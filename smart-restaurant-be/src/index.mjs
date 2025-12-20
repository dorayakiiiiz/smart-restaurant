
import express from 'express'
import cors from 'cors'
import passport from 'passport'
import cookiePaser from 'cookie-parser'


import { configDotenv } from "dotenv";
configDotenv();

import dbConnect from "./config/db/index.mjs";
import route from "./routes/index.mjs";

const app = express();
const PORT = process.env.PORT;

// connect to database
dbConnect();

// Init passport
app.use(passport.initialize())

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

const allowedOrigins = [
    "http://localhost:5173", // frontend dev
    'https://wad-smart-restaurant.vercel.app'
];

const corsOptions = {
    origin: allowedOrigins, 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.options(/.*/, cors(corsOptions));

// route app
route(app);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
