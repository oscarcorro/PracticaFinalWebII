const {handleHttpError} = require("../utils/handleError")
const Client = require("../models/nosql/client")

//crear un nuevo cliente
const createClient = async(req, res) => {
    try{
        const clientData = req.body
        clientData.createdBy = req.user.id //asociar el cliente al usuario que ha iniciado sesión

        //comprobamos si existe el cliente con el mismo CIF para este usuario
        const existingClient = await Client.findOne({cif: clientData.cif, createdBy: req.user.id})
        if(existingClient)
            return handleHttpError(res, "CLIENT_ALREADY_EXISTS", 409)


        const newClient = await Client.create(clientData)
        res.status(201).json(newClient)
    } catch(error) {
        console.error(error)
        handleHttpError(res, "ERROR_CREATE_CLIENT", 500)
    }
}

//obtener todos los clientes, filtrados por usuario
const getClients = async(req, res) => {
    try{
        const filter = {createdBy: req.user.id}
        const clients = await Client.find(filter)
        res.json(clients)
    } catch(error) {
        console.error(error)
        handleHttpError(res, "ERROR_GET_CLIENT", 500)
    }
}

//obtener un cliente por id
const getClient = async(req, res) => {
    try{
        const {id} = req.params
        const client = await Client.findById(id)
        if(!client)
            return handleHttpError(res, "ERROR_GET_CLIENT", 404)

        res.json(client)
    } catch(error) {
        console.error(error)
        handleHttpError(res, "ERROR_GET_CLIENT", 500)
    }
}

//actualizar cliente
const updateClient = async (req, res) => {
    try{
        const {id} = req.params
        const updatedClient = await Client.findByIdAndUpdate(id, req.body, {new:true})
        if(!updatedClient)
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404)

        res.json(updatedClient)
    } catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_UPDATE_CLIENT", 500)
    }
}

//archivar (soft-delete) un cliente
const deleteClient = async(req, res) => {
    try{
        const {id} = req.params
        const deletedClient = await Client.delete({_id: id})
        if(!deletedClient)
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404)

        res.json({message: "Cliente archivado (soft-delete)"})
    } catch(error) {
        console.error(error)
        handleHttpError(res, "ERROR_DELETE_CLIENT", 500)
    }
}

//eliminar un cliente (hard-delete)
const hardDeleteClient = async(req, res) => {
    try{
        const {id} = req.params
        const client = await Client.findByIdAndDelete(id)
        if(!client)
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404)

        res.json({message: "Cliente eliminado permanentemente"})
    }catch(error) {
        console.error(error)
        handle
    }
}

//obtener listado de clientes archivados mediante soft-delete
const getArchivedClients = async(req, res) => {
    try {
        const clients = await Client.findDeleted({createdBy: req.user.id})
        res.json(clients)
    } catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_GET_ARCHIVED_CLIENTS", 500)
    }
}

//recuperar cliente archivado
const restoreClient = async(req, res) => {
    try {
        const {id} = req.params
        const restoredClient = await Client.restore({_id: id})

        if(!restoredClient)
            return handleHttpError(res, "CLIENT_NOT_FOUND", 404)

        res.json({message: "Cliente recuperado correctamente"})
    } catch(error){
        console.error(error)
        handleHttpError(res, "ERROR_RESTORE_CLIENT", 500)
    }
}

module.exports = {createClient, getClients, getClient, updateClient, deleteClient, hardDeleteClient, getArchivedClients, restoreClient}