const { handleHttpError } = require("../utils/handleError") //manejo de errores
const User = require("../models/nosql/user") //modelo de un usuario en la BD
const { tokenSign } = require("../utils/handleJwt")
const { encrypt } = require("../utils/handlePassword")

//función para obtener todos los usuarios
const getUsers = async (req, res) => {
    try {
        const users = await User.find(); //busca todos los usuarios de la base de datos
        res.send(users); //mandamos la respuesta con todos los user
    } catch (error) {
        handleHttpError(res, "ERROR_GET_USERS", 500);
    }
}
//función para obtener un usuario a través del id
const getUser = async (req, res) => {
    try {
        const { id } = req.params //obtiene el id de los parametros
        const user = await User.findById(id) //busca por id
        if (!user) return handleHttpError(res, "USER_NOT_FOUND", 404) //si no hay user...
        res.json(user) //devuelve la info del usuario
    } catch (error) {
        handleHttpError(res, "ERROR_GET_USER", 500);
    }
}
//función para actualizar la info de un user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params; //obtenemos id de params
        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true }); //buscamos y actualizamos 
        if (!updatedUser) return handleHttpError(res, "USER_NOT_FOUND", 404); //si no existe user..
        res.json(updatedUser); //devolvemos la info del usuario
    } catch (error) {
        handleHttpError(res, "ERROR_UPDATE_USER", 500);
    }
}
//función para eliminar un usuario (soft-delete de mongoose)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params; //obtenemos id de params
        const deletedUser = await User.findByIdAndDelete(id); //buscamos y eliminamos
        if (!deletedUser) return handleHttpError(res, "USER_NOT_FOUND", 404); //si no hay user...
        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        handleHttpError(res, "ERROR_DELETE_USER", 500);
    }
}

//ACtualizar datos de la compañia
const updateUserCompanyData = async (req, res) => {
    try {
        const userId = req.user.id
        const { name, cif, address } = req.body

        const user = await User.findById(userId)
        if (!user) 
            return handleHttpError(res, "USER_NOT_FOUND", 404)

        let companyData
        if(user.isAutonomous){
            //si el usuario es autónomo, la compañía usa sus datos personales
            companyData = { name: user.name, cif: user.nif, address: "Dirección autónoma" };
        }else{
            companyData = {name, cif, address}
        }

        user.company = companyData
        await user.save()

        res.json({ message: "Company data updated successfully!", user })
    }catch(error){
        handleHttpError(res, "ERROR_UPDATING_COMPANY_DATA", 500)
    }
}

//Obtener usuario a partir del JWT
const getProfile = async(req, res) => {
    try{
        const userId = req.user.id //Sacamos el id del token
        const user = await User.findById(userId).select("-password")
        if(!user)
            return handleHttpError(res, "USER_NOT_FOUND", 404)

        res.json(user)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_GET_PROFILE", 500)
    }
}

//delete hard o soft según un parámetros
const deleteProfile = async(req, res) => {
    try{
        const userId = req.user.id
        const softDelete = req.query.soft !== "false" //si es false hard delete

        const user = await User.findById(userId)
        if(!user) 
            return handleHttpError(res, "USER_NOT_FOUND", 404)

        if(softDelete){
            await user.delete() // soft delete
            res.json({ message: "Usuario eliminado (soft delete)" })
        }else{
            await User.findByIdAndDelete(userId) //hard delete
            res.json({ message: "Usuario eliminado permanentemente (hard delete)" })
        }
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_DELETE_PROFILE", 500)
    }
}

//función para generar un código de verificación de 6 dígitos
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

//invitar a un compañero
const inviteUser = async(req, res) => {
    try{
        const userId = req.user.id
        const {email} = req.body

        const inviter = await User.findById(userId)
        if(!inviter) 
            return handleHttpError(res, "INVITER_NOT_FOUND", 404)

        const existingUser = await User.findOne({email})
        if (existingUser)
            return handleHttpError(res, "EMAIL_ALREADY_EXISTS", 409)

        const tempPassword = Math.random().toString(36).slice(-8) //contraseña temporal
        const hashedPassword = await encrypt(tempPassword)

        const verificationCode = generateVerificationCode()

        const newUser = await User.create({
            email,
            password: hashedPassword,
            role: "guest", //rol de invitad
            company: inviter.company, //misma compañía que el que invita
            status: "pending",
            verificationCode, //guardamos el código en el usuario
            attemptsLeft: 3 //intentos restantes
        })

        newUser.set("password", undefined, {strict: false})

        const token = await tokenSign(newUser)

        const emailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Código de verificación',
            html: `<h1>Verificación de cuenta</h1><p>Tu código es: <strong>${verificationCode}</strong></p>`
        };

        res.json({
            message: "Usuario invitado creado correctamente",
            user: newUser,
            tempPassword,
            token
        })
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_INVITE_USER", 500)
    }
}



module.exports = { getUsers, getUser, updateUser, deleteUser, updateUserCompanyData, getProfile, deleteProfile, inviteUser} //exportamos todas las funciones
