const {check} = require("express-validator")
const validateResults = require("../utils/handleValidator")

//validador para datos personales:
const validatorPersonalData = [
    check("name").notEmpty().withMessage("El nombre es obligatorio"),
    check("lastname").notEmpty().withMessage("El apellido es obligatorio"),
    check("nif").notEmpty().withMessage("El NIF es obligatorio"),
    validateResults
]

//validador para datos de la compalia
const validatorCompanyData = [
    check("name").notEmpty().withMessage("El nombre es obligatorio"),
    check("cif").notEmpty().withMessage("El CIF es obligatorio"),
    check("address").notEmpty().withMessage("La dirección es obligatoria"),
    validateResults
]

module.exports = {validatorPersonalData, validatorCompanyData}