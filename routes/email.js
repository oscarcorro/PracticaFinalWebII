const express = require("express") //framework servidores
const { validatorMail } = require("../validators/emailValidator") //validador para enviar el mail
const { send } = require("../controllers/mail") //función de envair emails
const {authMiddleware} = require('../middleware/authMiddleware')


const router = express.Router()

router.post("/send", authMiddleware, validatorMail, send)

module.exports = router