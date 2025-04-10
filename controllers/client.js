const {handleHttpError} = require("../utils/handleError")
const Client = require("../models/nosql/client")

//crear un nuevo cliente
const createClient = async(req, res) => {
    try{
        const clientData = req.body
        const newClient = await Client.create(clientData)
        res.status(201).json(newClient)
    } catch(error) {
        console.error(error)
        handleHttpError(res, "ERROR_CREATE_CLIENT", 500)
    }
}

//obtener todos los clientes
const getClients = async(req, res) => {
    try{
        const clients = await Client.find({})
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

        res.json
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

module.exports = {createClient, getClients, getClient, updateClient, deleteClient, hardDeleteClient}