import mongoose from "mongoose";


const connectDB = async () => {
    const connectionString = process.env.MONGO_URI;
    if (connectionString) {
        await mongoose.connect(connectionString);
        console.log("MongoDB connected");
        return;
    }
    throw new Error("MONGO_URI is not defined in environment variables");
};

export default connectDB;
