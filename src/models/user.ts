import mongoose, { InferSchemaType } from "mongoose";
const { Schema, model, Types } = mongoose;

const userSchema = new Schema({
    firstName: String,
    lastName: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    passwordHash: String,
    dateOfBirth: Date,
    gender: String,
    lookingFor: [String],
    location: {
        city: String,
        country: String,
    },
    bio: String,
    interests: [String],
    profilePhotos: [String],
    createdAt: { type: Date, default: Date.now },
    lastLogin: Date,
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    preferences: {
        ageRange: {
            min: Number,
            max: Number
        },
        distance: Number
    },
    likesSent: [{ type: Types.ObjectId, ref: "User" }],
    likesReceived: [{ type: Types.ObjectId, ref: "User" }],
    matches: [{ type: Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: Types.ObjectId, ref: "User" }],
    reportedUsers: [{ type: Types.ObjectId, ref: "User" }],
    accountStatus: { type: String, default: "active" }
});
//User type
export type User = InferSchemaType<typeof userSchema>;
export default model("User", userSchema);
