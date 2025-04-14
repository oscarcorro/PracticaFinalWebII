const supertest = require('supertest')
const { app, server } = require('../index')
const mongoose = require('mongoose')
const { encrypt } = require('../utils/handlePassword')
const { tokenSign } = require('../utils/handleJwt')
const User = require('../models/nosql/user')
const Client = require('../models/nosql/client')
const Project = require('../models/nosql/project')

const api = supertest(app)

let token
let userId
let clientId
let projectId

beforeAll(async () => {
  await new Promise((resolve) => mongoose.connection.once('connected', resolve))

  await User.deleteMany({})
  await Client.deleteMany({})
  await Project.deleteMany({})

  //Crear usuario
  const passwordHash = await encrypt('testpassword123')
  const user = await User.create({
    email: 'testprojectuser@gmail.com',
    password: passwordHash,
    name: 'Test',
    lastname: 'ProjectUser',
    nif: '12345678Z'
  })
  user.set('password', undefined, {strict: false})

  token = await tokenSign(user)
  userId = user._id

  //Crear cliente para asociarlo al proyecto
  const client = await Client.create({
    name: 'Cliente de Proyecto',
    cif: 'C12345678',
    address: 'Calle Proyecto 789',
    email: 'clienteproyecto@example.com', 
    createdBy: userId 
  })
  clientId = client._id
})

afterAll(async () => {
  await server.close()
  await mongoose.connection.close()
})

describe('Project API tests', () => {
  test('Crear un nuevo proyecto', async () => {
    const response = await api
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Proyecto Test',
        description: 'Proyecto de prueba para testing',
        client: clientId
      })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(response.body.name).toBe('Proyecto Test')
    projectId = response.body._id
  })

  test('Evitar crear proyecto duplicado', async () => {
    await api
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Proyecto Test',
        description: 'Intento duplicado',
        client: clientId
      })
      .expect(404); //deberia salirPROJECT_ALREADY_EXISTS
  })

  test('Listar proyectos del usuario', async () => {
    const response = await api
      .get('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.length).toBeGreaterThanOrEqual(1)
  })

  test('Obtener proyecto por ID', async () => {
    const response = await api
      .get(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body._id).toBe(projectId)
  })

  test('Actualizar un proyecto', async () => {
    const response = await api
      .put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Descripción actualizada'
      })
      .expect(200);

    expect(response.body.description).toBe('Descripción actualizada')
  })

  test('Archivar (soft-delete) un proyecto', async () => {
    const response = await api
      .delete(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.message).toBe('Proyecto archivado (soft-delete)')
  })

  test('Listar proyectos archivados', async () => {
    const response = await api
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.length).toBeGreaterThanOrEqual(1)
  })

  test('Restaurar un proyecto archivado', async () => {
    const response = await api
      .patch(`/api/project/restore/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.message).toBe('Proyecto recuperado correctamente')
  })

  test('Eliminar proyecto permanentemente (hard delete)', async () => {
    const response = await api
      .delete(`/api/project/hard/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(response.body.message).toBe('Proyecto eliminado permanentemente')
  })
})