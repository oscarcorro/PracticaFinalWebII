const supertest = require('supertest')
const {app, server} = require('../index')
const mongoose = require('mongoose')
const {encrypt} = require('../utils/handlePassword')
const {tokenSign} = require('../utils/handleJwt')
const User = require('../models/nosql/user')
const Client = require('../models/nosql/client')

const api = supertest(app)

let token
let userId
let clientId

beforeAll(async () => {
  await new Promise((resolve) => mongoose.connection.once('connected', resolve))
  await User.deleteMany({})
  await Client.deleteMany({})

  //Crear usuario para autenticación
  const passwordHash = await encrypt('testpassword123')
  const user = await User.create({
    email: 'testclientuser@gmail.com',
    password: passwordHash,
    name: 'Test',
    lastname: 'ClientUser',
    nif: '12345678Z'
  })

  user.set('password', undefined, {strict: false})

  token = await tokenSign(user)
  userId = user._id
})

afterAll(async () => {
  server.close()
  await mongoose.connection.close()
})

describe('Client API tests', () => {
  test('Crear un nuevo cliente', async () => {
    const response = await api
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Empresa Test S.L.',
        cif: 'B98765432',
        address: 'Calle Test 123',
        phone: '600123456',
        email: 'empresa@gmail.com'
      })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(response.body.name).toBe('Empresa Test S.L.')
    clientId = response.body._id //guardar id
  })

  test('Evitar crear un cliente duplicado', async () => {
    await api
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Empresa Test S.L.',
        cif: 'B98765432',
        address: 'Otra Calle 456',
        phone: '600999999',
        email: 'duplicado@gmail.com'
      })
      .expect(409)
  })

  test('Listar clientes del usuario', async () => {
    const response = await api
      .get('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body.length).toBeGreaterThanOrEqual(1)
  })

  test('Obtener cliente por ID', async () => {
    const response = await api
      .get(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body._id).toBe(clientId);
  })

  test('Actualizar un cliente', async () => {
    const response = await api
      .put(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: 'Nueva Avenida 789',
        phone: '600654321'
      })
      .expect(200)

    expect(response.body.address).toBe('Nueva Avenida 789')
  }, 20000)

  test('Archivar (soft-delete) un cliente', async () => {
    const response = await api
      .delete(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Cliente archivado (soft-delete)')
  });

  test('Listar clientes archivados', async () => {
    const response = await api
      .get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.length).toBeGreaterThanOrEqual(1)
  })

  test('Recuperar un cliente archivado', async () => {
    const response = await api
      .patch(`/api/client/restore/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Cliente recuperado correctamente')
  })

  test('Eliminar cliente permanentemente (hard delete)', async () => {
    const response = await api
      .delete(`/api/client/hard/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.message).toBe('Cliente eliminado permanentemente')
  })
})
