const express = require('express')
const {createClient, getClients, getClient, updateClient, deleteClient, hardDeleteClient, getArchivedClients, restoreClient} = require('../controllers/client')
const {authMiddleware} = require('../middleware/authMiddleware')
const {validatorCreateClient, validatorUpdateClient} = require("../validators/clientValidator")

const router = express.Router()

//Crear cliente
router.post('/', authMiddleware, validatorCreateClient, createClient) //falta implementar el validator
//Obtener todos los clientes
router.get('/', authMiddleware, getClients)
//Listado de clientes archivados
router.get('/archived', authMiddleware, getArchivedClients)
//Obtener un cliente por id
router.get('/:id', authMiddleware, getClient)
//Actualizar cliente
router.put('/:id', authMiddleware, validatorUpdateClient, updateClient) //falta implementar validator
//Eliminar un cliente
router.delete('/:id', authMiddleware, deleteClient)
//Borrado permanente de un cliente
router.delete('/hard/:id', authMiddleware, hardDeleteClient)
//Recuperar cliente archivado
router.patch('/restore/:id', authMiddleware, restoreClient)

module.exports = router