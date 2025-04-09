//Controlador que tiene los endpoints de registro y login
const {matchedData} = require("express-validator") //datos validados
const {encrypt, compare} = require("../utils/handlePassword") //funciones para cifrar y comparar la contraaesña
const {tokenSign} = require("../utils/handleJwt") //función para firmar y generar el token
const User = require("../models/nosql/user") //modelo del usuario en mongoDB
const {handleHttpError} = require("../utils/handleError") //manejo de errores
const jwt = require("jsonwebtoken")

//Controlador para registrar un nuevo usuario
const registerCtrl = async(req, res) => {
    try {
        req = matchedData(req) //extraemos solo los datos validados
        //verificamos si el email ya existe en la BD
        const existingUser = await User.findOne({email: req.email})
        if(existingUser){
            return handleHttpError(res, "EMAIL_ALREADY_EXISTS", 409)
        }

        const password = await encrypt(req.password) //ciframos la pass
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); //codigo de verifiacion aleatorio de 6 digitos
        //si el usuario es autonomo se autoasignan los datos personales a la compañía
        const companyData = req.isAutonomous ? {name: req.name, cif: req.nif, address: "Dirección autónomo"} : {}
        console.log("Datos de la empresa: ", companyData)
        //creamos un nuevo usuario
        const newUser = await User.create({
            ...req,
            password,
            verificationCode,
            status: "pending",
            company: companyData
        })

        newUser.set("password", undefined, {strict: false}) //no mostrar la contraseña
        //respuesta con el token y el usuario nuevo
        const data = {
            token: await tokenSign(newUser),
            user: newUser
        }

        res.send(data) //enviamos token y user
    } catch(error) {
        handleHttpError(res, "ERROR_REGISTER_USER")
    }
}

//función para iniciar sesión
const loginCtrl = async(req, res) => {
    try {
        req = matchedData(req) //datos validados
        const user = await User.findOne({email: req.email}).select("+password") //busacamos el user y obtenemos la pass
    
        if(!user){ //si el user no existe
            return handleHttpError(res, "USER_NOT_FOUND", 404)
        }
        //comparamos la pass
        const checkPassword = await compare(req.password, user.password)
        if(!checkPassword){
            return handleHttpError(res, "INVALID_PASSWORD", 401)
        }

        user.set("password", undefined, {strict: false}) //no mostrar la contraseña
        //generamos un token nuevo
        const data = {
            token: await tokenSign(user),
            user
        }

        res.send(data) //enviamos token e info del user
    } catch(error) {
        console.log(error)
        handleHttpError(res, "ERROR_LOGIN_USER", 500)
    }
}

const validateEmailCtrl = async(req, res) => {
    try {
        const {code} = req.body //codigo ingresado por el usuario para validar
        const userId = req.user.id //obtenemos el id del usuarios

        const user = await User.findById(userId)

        if(!user)   //no existe user
            return handleHttpError(res, "USER_NOT_FOUND", 404)

        if(user.status == "verified") //usuario ya verificado
            return handleHttpError(res, "USER_ALREADY_VERIFIED", 400)

        if(user.verificationCode != code) //codigo ingresado erroneo
            return handleHttpError(res, "INVALID_VERIFICATION_COIDE", 401)

        //si el código es correcto, existe el user y no esta verificado actualizamos:
        user.status = "verified"
        user.verificationCode = null
        await user.save()

        res.json({message: "EMAIL_VERIFIED"})
    } catch(error) {
        handleHttpError(res, "ERROR_VALIDATING_EMAIL", 500)
    }
}

//recuperar contraseña con token temporal
const recoverPassword = async(req, res) => {
    try{
        const {email} = req.body
        const user = await User.findOne({email})
        if(!user)
            return handleHttpError(res, "USER_NOT_FOUND", 404)

        const token = jwt.sign(
            {id: user._id},
            process.env.JWT_SECRET,
            {expiresIn: "10m"}
        )

        res.json({ message: "Token para recuperar contraseña generado", token })
    } catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_RECOVER_PASSWORD", 500)
    }
}

//Cambiar contraseña
const resetPassword = async(req, res) => {
    try {
        const {token, newPassword} = req.body
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.id)
        if(!user) 
            return handleHttpError(res, "USER_NOT_FOUND", 404)

        user.password = await encrypt(newPassword)
        await user.save()

        res.json({ message: "Contraseña actualizada correctamente" })
    } catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_RESET_PASSWORD", 500)
    }
}

module.exports = {registerCtrl, loginCtrl, validateEmailCtrl, recoverPassword, resetPassword}