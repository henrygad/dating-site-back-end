
import { Types } from "mongoose";

interface userTypes {
    _id: Types.ObjectId; // if you're using .populate() or saving to DB
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    passwordHash: string;
    dateOfBirth: Date;
    gender: string;
    lookingFor: string[];
    location: {
        city: string;
        country: string;
    };
    bio: string;
    interests: string[];
    profilePhotos: string[];
    createdAt: Date;
    lastLogin?: Date;
    isVerified: boolean;
    isOnline: boolean;
    preferences: {
        ageRange: {
            min: number;
            max: number;
        };
        distance: number;
    };
    likesSent: Types.ObjectId[];       
    likesReceived: Types.ObjectId[];
    matches: Types.ObjectId[];
    blockedUsers: Types.ObjectId[];
    reportedUsers: Types.ObjectId[];
    accountStatus: "active" | "disabled" | "banned" | string; // if you expect more options
    emailVerificationToken: string;
    emailVerificationTokenExpiringdate: number;
    isValidPassword: (password: string)=> Promise<boolean>,  
}

export default userTypes;