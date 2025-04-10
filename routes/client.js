const express = require('epxress')
const {createClient, getClients, getClient, updateClient, deleteClient, hardDeleteClient} = require('../controllers/client')
const {authMiddleware} = require('..middleware/authMiddleware')

const router = express.Router()

//Crear cliente
router.post('/', authMiddleware, createClient) //falta implementar el validator
//Obtener todos los clientes
router.get('/', authMiddleware, getClients)
//Obtener un cliente por id
router.get('/:id', authMiddleware, getClient)
//Actualizar cliente
router.put('/:id', authMiddleware, updateClient) //falta implementar validator
//Eliminar un cliente
router.delete('/:id', authMiddleware, deleteClient)
//Borrado permanente de un cliente
router.delete('/hard/:id', authMiddleware, hardDeleteClient);

module.exports = router