const { sendEmail } = require('../utils/handleEmail') //función para enviar emails
const { handleHttpError } = require('../utils/handleError') //manejo de errores
const { matchedData } = require('express-validator') //validar la infromación
const send = async (req, res) => { //función para enviar los emails
    try {
        const info = matchedData(req) //datos validados
        const data = await sendEmail(info)
        res.send(data) //enviamos la info del email
    } catch (err) {
        //console.log(err)
        handleHttpError(res, 'ERROR_SEND_EMAIL')
    }
}
module.exports = { send }