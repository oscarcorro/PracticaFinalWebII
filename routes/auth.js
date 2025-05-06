const express = require("express"); //framework para crear servidores
const { registerCtrl, loginCtrl, validateEmailCtrl, recoverPassword, resetPassword } = require("../controllers/auth"); //funciones para regsitrar e inicio de sesion
const { validatorRegister, validatorLogin } = require("../validators/authValidator"); //funciones para validar los datos (email y pass)
const {authMiddleware} = require("../middleware/authMiddleware") //middleware para validar el JWT

const router = express.Router()
//rutas
router.post("/register", validatorRegister, registerCtrl)
router.post("/login", validatorLogin, loginCtrl)
router.post("/validate", authMiddleware, validateEmailCtrl) 
router.post("/recover-password", recoverPassword)
router.post("/reset-password", resetPassword)

module.exports = router
