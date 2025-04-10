const mongoose = require('mongoose')
const mongooseDelete = require('mongoose-delete')

const ClientSchema = new mongoose.Schema(
    {
        name: { //nombre de la empresa/cliente
            type: String,
            required: true,
            trim: true
        },
        cif: { //CIF del cliente, unico
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        address: {
            type: String,
            required: true
        },
        phone: {
            type: String
        },
        email: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true, //createdAt y updatedAt
        versionKey: true
    }
)

ClientSchema.plugin(mongooseDelete, {overrideMethods: 'all', deletedAt: true})

module.exports = mongoose.model('Client', clientSchema)

