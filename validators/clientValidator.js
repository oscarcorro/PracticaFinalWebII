const {check} = require("express-validator")

const validatorCreateClient = [
    check("name").notEmpty().withMessage("El nombre es obligatorio"),
    check("cif").notEmpty().withMessage("El CIF es obligatorio").isLength({min: 8}).withMessage("El CIF debe tener al menos 8 caracteres"),
    check("address").notEmpty().withMessage("La dirección es obligatoria"),
    check("email").optional().isEmail().withMessage("Debe ser un email válido"),
    check("phone").optional().isLength({min: 9}).withMessage("El teléfono debe tener al menos 9 dígitos")

]

const validatorUpdateClient = [
    check("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
    check("cif").optional().isLength({min: 8}).withMessage("El CIF debe tener al menos 8 caracteres"),
    check("address").optional().withMessage("La dirección no puede estar vacía"),
    check("email").optional().isEmail().withMessage("Debe ser un email válido"),
    check("phone").optional().isLength({min: 9}).withMessage("El teléfono debe tener al menos 9 dígitos")

]

module.exports = {validatorCreateClient, validatorUpdateClient}