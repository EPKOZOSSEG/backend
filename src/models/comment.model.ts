
import { Schema, model } from "mongoose";
import Joi from "joi";

const commentSchema = new Schema(
    {
        _id: {
            type: Schema.Types.ObjectId,
            readonly: true
        },
        refernce_id: {
            type: Schema.Types.ObjectId,
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        comment: {
            type: String,
            required: true
        },
        like: {
            type: Number,
            default: 0
        },
        dislike: {
            type: Number,
            default: 0
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
        refernce_id: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        comment: Joi.string().required(),
    });
    return schema.validate(message);
};

const commentModel = model("comment", commentSchema, "Comment");


export default {commentModel, validate};