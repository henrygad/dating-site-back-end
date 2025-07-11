import mongoose from "mongoose";


const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI || "local mongo db connection string");
    console.log("MongoDB connected");
};

export default connectDB;
