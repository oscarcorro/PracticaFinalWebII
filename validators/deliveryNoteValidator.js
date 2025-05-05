const {check} = require("express-validator")

const validatorCreateDeliveryNote = [
    check("client").notEmpty().withMessage("El cliente es obligatorio"),
    check("project").notEmpty().withMessage("El proyecto es obligatorio"),
    check("type").notEmpty().isIn(["hours", "materials"]).withMessage("El tipo debe ser 'hours' o 'materials'"),
    check("entries").isArray({min: 1}).withMessage("Debe haber al menos una entrada"),
    check("entries.*.description").notEmpty().withMessage("Cada entrada debe tener una descripción"),
    check("entries.*.quantity").isNumeric().withMessage("La cantidad debe ser numérica"),
    check("entries.*.unit").optional().isString().withMessage("La unidad debe ser texto")
]
  
  module.exports = {
    validatorCreateDeliveryNote
  }