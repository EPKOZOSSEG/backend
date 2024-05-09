
import { Schema, model } from "mongoose";
import Joi from "joi";

const cargoSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        name:{
            type: String,
            required: true
        },
        description:{
            type: String,
            required: true
        },
        price:{
            type: Number,
            required: true
        },
        currency:{
            type: String,
            required: true
        },
        payment: {
            type: String,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        pictures:{
            type: Array<string>(),
            default: []
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    { versionKey: false },
);

const validate = (message: object): Joi.ValidationResult => {
    const schema = Joi.object().keys({
        name: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().required(),
        currency: Joi.string().required(),
        payment: Joi.string().required(),
        location: Joi.string().required(),
        pictures: Joi.array().items(Joi.string()).optional()
    });
    return schema.validate(message);
};

const cargoModel = model("cargo", cargoSchema, "Cargo");


export default {cargoModel, validate};