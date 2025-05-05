const {matchedData} = require("express-validator")
const {handleHttpError} = require("../utils/handleError")
const DeliveryNote = require("../models/nosql/deliveryNote")
const Client = require("../models/nosql/client")
const User = require("../models/nosql/user")
const {generatePDF}  = require("../utils/generatePDF")
const path = require("path")
const { uploadToPinata } = require("../utils/handleUploadIPFS")
const fs = require("fs")


//crear un albarán
const createDeliveryNote = async(req, res) => {
    try{
        const userId = req.user.id
        const body = matchedData(req)

        const newDeliveryNote = await DeliveryNote.create({
            ...body,
            createdBy: userId
        })

        res.status(200).json(newDeliveryNote)
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
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404)

        res.json(deliveryNote)
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_GET_DELIVERY_NOTE", 500)
    }
}

//firmar albarán
const signDeliveryNote = async (req, res) => {
    try{
        const {id} = req.params
        
        if(!req.file)
            return handleHttpError(res, "SIGNATURE_IMAGE_REQUIRED", 400)
        
        //obtener buffer del archivo
        const fileBuffer = req.file.buffer
        const fileName = req.file.originalname
        
        //buscar el albarán
        const deliveryNote = await DeliveryNote.findById(id)
            .populate("client")
            .populate("project")
            .populate("createdBy")
            
        if(!deliveryNote) 
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404)
        
        //subir la firma a IPFS pinata
        console.log("Subiendo firma a IPFS...")
        const pinataResponse = await uploadToPinata(fileBuffer, fileName)
        const ipfsHash = pinataResponse.IpfsHash
        const signatureUrl = `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${ipfsHash}`
        
        //actualizar el albarán con la URL de la firma
        deliveryNote.signed = true
        deliveryNote.signatureUrl = signatureUrl
        //generar el PDF y guardarlo temporalmente
        const tempPdfPath = path.join(__dirname, `../storage/deliverynote-${id}-${Date.now()}.pdf`)
        await generatePDF(deliveryNote, tempPdfPath)
        
        //leer el PDF como buffer para subirlo a IPFS
        const pdfBuffer = fs.readFileSync(tempPdfPath)
        //subir el PDF a IPFS
        console.log("Subiendo PDF a IPFS...")
        const pdfResponse = await uploadToPinata(pdfBuffer, `deliverynote-${id}.pdf`)
        const pdfIpfsHash = pdfResponse.IpfsHash
        const pdfUrl = `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${pdfIpfsHash}`
        //guardar la URL del PDF en el albarán
        deliveryNote.pdfUrl = pdfUrl
        await deliveryNote.save()
        //eliminar el archivo temporal del PDF
        fs.unlinkSync(tempPdfPath);
        res.json({
            message: "Albarán firmado correctamente",
            signatureUrl: deliveryNote.signatureUrl,
            pdfUrl: deliveryNote.pdfUrl
        })
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

//descargar PDF del albaran
const downloadDeliveryNotePDF = async(req, res) => {
    try{
        const {id} = req.params
        const deliveryNote = await DeliveryNote.findById(id)
            .populate("client")
            .populate("project")
            .populate("createdBy")

        if(!deliveryNote)
            return handleHttpError(res, "DELIVERY_NOTE_NOT_FOUND", 404)
        
        if(deliveryNote.createdBy._id.toString() !== req.user.id && req.user.role !== "guest")
            return handleHttpError(res, "UNAUTHORIZED", 403)

        //generar un nombre para el archivo local
        const localPdfPath = path.join(__dirname, `../storage/deliverynote-${id}-${Date.now()}.pdf`)

        //si el albarán está firmado y tiene URL en IPFS, descargar de IPFS y guardar localmente
        if(deliveryNote.signed && deliveryNote.pdfUrl) {
            try {
                console.log("Descargando PDF desde IPFS:", deliveryNote.pdfUrl)
                const response = await fetch(deliveryNote.pdfUrl)
                if (!response.ok) {
                    throw new Error(`Error al descargar el PDF: ${response.statusText}`)
                }
                
                //obtener el contenido del PDF y guardarlo localmente
                const arrayBuffer = await response.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                fs.writeFileSync(localPdfPath, buffer)
                
                console.log(`PDF guardado localmente en: ${localPdfPath}`)
                
                return res.download(localPdfPath, `albaran-${id}.pdf`, (error) => {
                    if(error){
                        console.error(error)
                        //n eliminamos el archivo para que quede guardado localmente
                        return handleHttpError(res, "ERROR_DOWNLOAD_PDF", 500)
                    }
                    
                    console.log(`PDF enviado al cliente y guardado en: ${localPdfPath}`)
                })
            } catch (error) {
                console.error("Error al descargar desde IPFS:", error)
                //si falla la descarga desde IPFS, generamos el PDF localmente
            }
        }

        //si no tiene URL en IPFS o falló la descarga, generar el PDF normalmente
        await generatePDF(deliveryNote, localPdfPath)
        
        res.download(localPdfPath, `albaran-${id}.pdf`, (error) => {
            if(error){
                console.error(error)
                return handleHttpError(res, "ERROR_DOWNLOAD_PDF", 500)
            }
            
            console.log(`PDF enviado al cliente y guardado en: ${localPdfPath}`)
        })
    }catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_GENERATE_PDF", 500)
    }
}


module.exports = {createDeliveryNote, getDeliveryNotes, getDeliveryNote, signDeliveryNote, deleteDeliveryNote, downloadDeliveryNotePDF}