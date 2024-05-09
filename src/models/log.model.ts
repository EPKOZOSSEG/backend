
import { Schema, model } from "mongoose";
import Joi from "joi";

const cargoSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        path:{
            type: String,
            required: true
        },
        method:{
            type: String,
            required: true
        },
        date:{
            type: Date,
            required: true
        }
    },
    { versionKey: false },
);

const validate = (message: object): Joi.ValidationResult => {
    const schema = Joi.object().keys({
        path: Joi.string().required(),
        method: Joi.string().required(),
        date: Joi.date().required()
    });
    return schema.validate(message);
};

const logModel = model("log", cargoSchema, "Log");


export default {logModel, validate};