
import { Schema, model } from "mongoose";
import Joi from "joi";

const authSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        auth_group: {
            type: String,
            required: true,
            unique: true
        },
        auths: {
            type: Array<string>(),
            default: []
        },
    },
    { versionKey: false },
);

const validate = (message: object): Joi.ValidationResult => {
    const schema = Joi.object().keys({
        auth_group: Joi.string().required(),
        auths: Joi.array().items(Joi.string()).optional()
    });
    return schema.validate(message);
};

const authModel = model("auth", authSchema, "Auth");


export default {authModel, validate};