//middleware para encriptar y comparar la contraseña
const bcrypt = require("bcryptjs")

//función que encripta una contraseña antes de guardarla en la BD
const encrypt = async(clearPassword) => {
    return hash = await bcrypt.hash(clearPassword, 10)
}

//función que compara la contraseña con la contraseña hasehada almacenada para ver si coincide
const compare = async(clearPassword, hashedPassword) => {
    return await bcrypt.compare(clearPassword, hashedPassword)
}

module.exports = {encrypt, compare}