import { Schema,model } from "mongoose";

const userSchema = new Schema({
    phone: {
        required: true,
        type: String
    },
    address:{
        required: true,
        type: String
    },
    publicKey: {
        required: true,
        type: String
    },
    privateKey: {
        required: true,
        type: String
    },
});
export const User = model("User", userSchema);
