const {check} = require("express-validator")
const validateResults = require("../utils/handleValidator");

const validatorMail = [
    check("subject").exists().notEmpty(), //asunto
    check("text").exists().notEmpty(), //mensaje
    check("to").exists().notEmpty(), //destinatario
    check("from").exists().notEmpty(), //origen
    (req, res, next) => {
        return validateResults(req, res, next)
    }
]
    
module.exports = { validatorMail }