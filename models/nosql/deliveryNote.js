const mongoose = require("mongoose")
const mongooseDelete = require("mongoose-delete") //para soft-delete

const DeliveryNoteSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["hours", "materials"],
            required: true
        },
        entries: { //lista de trabajos/materiales/horas
            type: Array,
            required: true
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        signed: {
            type: Boolean,
            default: false
        },
        signatureUrl: {
            type: String
        },
        pdfUrl: {
            type: String
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

DeliveryNoteSchema.plugin(mongooseDelete, {overrideMethods: "all", deletedAt: true})

module.exports = mongoose.model("DeliveryNote", DeliveryNoteSchema)
