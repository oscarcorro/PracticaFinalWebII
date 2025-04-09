const mongoose = require('mongoose')
const mongooseDelete = require("mongoose-delete")

const UserSchema = new mongoose.Schema(
    {
        name: { //nombre del usuario string
            type: String
        },
        lastname: { //apellido del usuario string
            type: String
        },
        nif: { //nif del usuario string
            type: String
        },
        isAutonomous: { //el user es autonomo o no
            type: Boolean,
            default: false
        },
        company: { //compañia/datos si es autonomo con nombre cif y direccion
            name: String,
            cif: String,
            address: String
        },
        email: { //email string unico, obligatorio sin espacios
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        password: { //contraseña string obligatoria minimo 8 caracteres
            type: String,
            required: true,
            minlength: 8
        },
        status: { //estado del usuario string, verificado o pendiente (por defecto)
            type: String,
            enum: ["pending", "verified"],
            default: "pending"
        },
        role: { //rol del usuario string admin o user (por defecto)
            type: String,
            enum: ["user", "admin", "guest"],
            default: "user"
        },
        verificationCode: { //codigo de 6 digitos para verificar el email
            type: String
        },
        attemptsLeft: { //intentos para el codigo de verificacion
            type: Number,
            default: 3
        },
        logo: { //logo de la empresa
            type: String
        }
    },
    {
        timestamps: true, //hace createdAt, updatedAt
        versionKey: false
    }
)
//Utilizamos soft-delete de mongoose para no eliminar los usuarios del todo
UserSchema.plugin(mongooseDelete, {overrideMethods: "all", deletedAt: true })

module.exports = mongoose.model("User", UserSchema) //exportamos el modelo como User