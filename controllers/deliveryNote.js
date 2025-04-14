const {matchedData} = require("express-validator")
const {handleHttpError} = require("../utils/handleError")
const DeliveryNote = require("../models/nosql/deliveryNote")
const Client = require("../models/nosql/client")
const User = require("../models/nosql/user")

//crear un albarán
const createDeliveryNote = async(req, res) => {
    try{
        const userId = req.user.id
        const body = marchedData(req)

        const newDeliveryNote = await DeliveryNote.create({
            ...body,
            createdBy: userId
        })

        res.status(200)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_CREATE_DELIVERY_NOTE", 500)
    }
}

//listar todos los albaranes del usuario o de su empresa
const getDeliveryNotes = async(req, res) => {
    try{
        const userId = req.user.id
        const deliveryNotes = await DeliveryNote.find({createdBy: userId})

        res.json(deliveryNotes)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_GET_DELIVERY_NOTES", 500)
    }
}

//mostart un albarán concreto con su id
const getDeliveryNote = async(req, res) => {
    try{
        const {id} = req.params
        const deliveryNote = await DeliveryNote.findById(id)
        .populate("client")
        .populate("project")
        .populate("createdBy")

        if(!deliveryNote)
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUN", 404)

        res.json(deliverynote)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_GET_DELIVERY_NOTE", 500)
    }
}

//falta implementar pdf

//firmar albarán 
const signDeliveryNote = async(req, res) => {
    try{
        const {id} = req.params
        const signatureUrl = req.file?.path

        if(!signatureUrl)
            return handleHttpError(res, "SIGNATURE_IMAGE_REQUIRED", 400)

        const deliveryNote = await DeliveryNote.findById(id)
        if(!deliveryNote) 
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404)

        deliveryNote.signed = true
        deliveryNote.signatureUrl = signatureUrl

        await.devliverynote.save()
        res.json({message: "Albarán firmado correctamente"})
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_SIGN_DELIVERY_NOTE", 500)
    }
}

//borrar albarán si no está firmad
const deleteDeliveryNote = async(req, res) => {
    try{
        const {id} = req.params
        const deliveryNote = await DeliveryNote.findById(id)

        if(!deliveryNote)
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404)
        if(deliveryNote.signed)
            return handleHttpError(res, "CANNOT_DELETE_SIGNED_DELIVERY_NOTE", 400)

        await deliveryNote.delete()
        res.json({message: "Albarán eliminado correctamente"})
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_DELETE_DELIVERY_NOTE", 500)
    }
}

module.exports = {createDeliveryNote, getDeliveryNotes, getDeliveryNote, signDeliveryNote, deleteDeliveryNote}