import mongoose from "mongoose";


export const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "CollabSpace"
        });

        console.log("Connected to MongoDB");
    } catch (err) {
        console.log("Error connecting to MongoDB", err);
        process.exit(1);
    }
};