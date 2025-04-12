const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const ProjectSchema = new mongoose.Schema(
    {
        name: { //nombre del proyecto
            type: String,
            required: true,
            trim: true
        },
        description: { //descripción del proyecto
            type: String,
            default: ''
        },
        client: { //cliente que ha creado el proyecto
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        createdBy: { //usuario que ha creado el proyecto
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

ProjectSchema.plugin(mongooseDelete, {overrideMethods: "all", deletedAt: true})

module.exports = mongoose.model('Project', ProjectSchema)
