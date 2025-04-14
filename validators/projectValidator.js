const {check} = require("express-validator")

//validador antes de crear un proyecto
const validatorCreateProject = [
    check("name").notEmpty().withMessage("El nombre del proyecto es obligatorio"),
    check("client").notEmpty().withMessage("El cliente es obligatorio"),
    check("description").optional().isString().withMessage("La descripción debe ser un texto")
]
//validador para actualizar un proyecto
const validatorUpdateProject = [
    check("name").notEmpty().withMessage("El nombre del proyecto es obligatorio"),
    check("client").notEmpty().withMessage("El cliente es obligatorio"),
    check("description").optional().isString().withMessage("La descripción debe ser un texto")
]

module.exports = {validatorCreateProject, validatorUpdateProject}