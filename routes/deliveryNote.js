const express = require("express")
const {authMiddleware} = require("../middleware/authMiddleware")
const {createDeliveryNote, getDeliveryNotes, getDeliveryNote, signDeliveryNote, deleteDeliveryNote, downloadDeliveryNotePDF} = require("../controllers/deliveryNote")
const {validatorCreateDeliveryNote} = require("../validators/deliveryNoteValidator")
const {uploadMiddleware, uploadMiddlewareMemory} = require("../middleware/uploadMiddleware")

const router = express.Router()

//Crear un albarán
router.post("/", authMiddleware, validatorCreateDeliveryNote, createDeliveryNote)

//Lista de todos los albaranes
router.get("/", authMiddleware, getDeliveryNotes)

//Obtener un albarán por id
router.get("/:id", authMiddleware, getDeliveryNote)

//Firmar un albarán
router.patch("/sign/:id", authMiddleware, uploadMiddlewareMemory.single("file"), signDeliveryNote)

//Eliminar un albarán si no está firmado
router.delete("/:id", authMiddleware, deleteDeliveryNote)

//Descragar un PDF de albarán
router.get("/pdf/:id", authMiddleware, downloadDeliveryNotePDF)

module.exports = router