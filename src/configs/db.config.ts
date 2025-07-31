import mongoose from "mongoose";

const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/my-local-db";


    if (!mongoURI) {
        console.error("❌ Mongo URI is missing. Please set MONGO_URI in .env.");
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("🚨 Failed to connect to MongoDB");

        if (error instanceof Error) {
            if ((error as any).name === "MongoNetworkError") {
                console.error(
                    "🌐 Possible network error or MongoDB server is unreachable."
                );
            } else if ((error as any).name === "MongoParseError") {
                console.error("🧾 Invalid MongoDB URI format.");
            } else if ((error as any).name === "MongoServerError") {
                console.error("💥 MongoDB server error:", error.message);
            }

            console.error("🔍 Reason:", error.message);
        } else {
            console.error("🔍 Reason:", error);
        }
        
        process.exit(1);

    }
};

mongoose.connection.on("error", (err) => {
    console.error("❗ Mongoose connection error:", err.message);
    process.exit(1);
});
mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  Mongoose disconnected, While Attempting to connect...");
});

export default connectDB;
