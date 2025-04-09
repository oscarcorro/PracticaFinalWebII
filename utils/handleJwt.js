//middleware para generar y verificar el JWT
const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET

//función para generar un token JWT con el ID y rol del usuario
const tokenSign = async (user) => {
    const sign = jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: "2h"
        }
    )
    return sign
}


//función para verificar si el token JWT es válido
const verifyToken = (tokenJwt) => {
    try {
        return jwt.verify(tokenJwt, JWT_SECRET)
    }catch(err){
        console.log(err)
        return null
    }
}

module.exports = {tokenSign, verifyToken}