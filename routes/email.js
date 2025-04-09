const express = require("express") //framework servidores
const { validatorMail } = require("../validators/emailValidator") //validador para enviar el mail
const { send } = require("../controllers/mail") //función de envair emails

const router = express.Router()
//rutas:
router.post("/send", validatorMail, send)

module.exports = router