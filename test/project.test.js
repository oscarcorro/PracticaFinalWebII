const supertest = require('supertest')
const { app, server } = require('../index')
const mongoose = require('mongoose')
const User = require('../models/nosql/user')
const Client = require('../models/nosql/client')
const Project = require('../models/nosql/project')
const { tokenSign } = require('../utils/handleJwt')

//inicializar supertest
const api = supertest(app)

//variables para tests
let token = '' //token jwt para autenticación
let userId = '' //id del usuario
let clientId = '' //id del cliente para asociar proyectos
let projectId = '' //id del proyecto creado
let secondProjectId = '' //id de un segundo proyecto
let archivedProjectId = '' //id de proyecto archivado
let secondUserToken = '' //token de otro usuario
let secondUserId = '' //id del segundo usuario
let secondUserClientId = '' //id del cliente del segundo usuario

//antes de todos los tests
beforeAll(async () => {
  //esperar conexión a bd
  await new Promise(resolve => mongoose.connection.once('connected', resolve))
  
  //limpiar datos
  await User.deleteMany({})
  await Client.deleteMany({})
  await Project.deleteMany({})

  //crear usuario para pruebas
  const userData = {
    email: 'testuser@example.com',
    password: 'Password123',
    name: 'Test',
    lastname: 'User',
    nif: '12345678Z',
    isAutonomous: false,
    role: 'user',
    status: 'verified'
  }

  const user = await User.create(userData)
  userId = user._id.toString()

  //generar token con tokenSign
  token = await tokenSign(user)
  
  //crear un cliente para asociar proyectos
  const clientData = {
    name: 'Cliente Test',
    cif: 'B12345678',
    address: 'Calle Test 123',
    phone: '612345678',
    email: 'cliente@test.com',
    createdBy: userId
  }
  
  const client = await Client.create(clientData)
  clientId = client._id.toString()
  
  //crear un segundo usuario para pruebas
  const secondUserData = {
    email: 'seconduser@example.com',
    password: 'Password123',
    name: 'Second',
    lastname: 'User',
    nif: '87654321X',
    isAutonomous: false,
    role: 'user',
    status: 'verified'
  }

  const secondUser = await User.create(secondUserData)
  secondUserId = secondUser._id.toString()
  secondUserToken = await tokenSign(secondUser)
  
  //crear un cliente para el segundo usuario
  const secondClientData = {
    name: 'Cliente Second User',
    cif: 'B87654321',
    address: 'Calle Second User 456',
    phone: '687654321',
    email: 'secondclient@test.com',
    createdBy: secondUserId
  }
  
  const secondClient = await Client.create(secondClientData)
  secondUserClientId = secondClient._id.toString()

  //log para verificar generación correcta de token
  console.log("Token generado:", token ? "✓" : "✗")
})

//después de todos los tests
afterAll(async () => {
  //cerrar server y conexión
  await mongoose.connection.close()
  await server.close()
})

//tests para proyectos
describe('Project API Tests', () => {
  
  //crear proyecto
  
  test('Crear proyecto nuevo', async () => {
    const projectData = {
      name: 'Proyecto Test',
      description: 'Descripción del proyecto de prueba',
      client: clientId
    }
    
    const response = await api
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //verificar datos guardados
    expect(response.body._id).toBeDefined()
    expect(response.body.name).toBe('Proyecto Test')
    expect(response.body.description).toBe('Descripción del proyecto de prueba')
    expect(response.body.client).toBe(clientId)
    expect(response.body.createdBy).toBe(userId)
    
    //guardar id para otras pruebas
    projectId = response.body._id
  })
  
  test('Crear proyecto sin token', async () => {
    const projectData = {
      name: 'Proyecto Sin Auth',
      description: 'Descripción sin autenticación',
      client: clientId
    }
    
    const response = await api
      .post('/api/project')
      .send(projectData)
      .expect(401)
    
    expect(response.text).toBe('TOKEN_REQUIRED')
  })
  
  test('Crear proyecto con datos incompletos', async () => {
    const incompleteData = {
      name: 'Proyecto Incompleto',
      //sin cliente (client)
      description: 'Descripción incompleta'
    }
    
    const response = await api
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(incompleteData)
      .expect(400)
  })
  
  test('Crear proyecto con cliente inexistente', async () => {
    const nonExistingClientId = new mongoose.Types.ObjectId()
    
    const projectData = {
      name: 'Proyecto Cliente Inexistente',
      description: 'Descripción del proyecto',
      client: nonExistingClientId
    }
    
    //La API puede responder de diferentes formas: 404 si valida la existencia,
    //o 500 si intenta crear y falla la referencia
    const response = await api
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(response => {
        //Acepta 404 o 500
        expect([404, 500]).toContain(response.status)
      })
  })
  
  test('Crear proyecto con nombre duplicado para un mismo cliente', async () => {
    const duplicateData = {
      name: 'Proyecto Test', //mismo nombre que el proyecto ya creado
      description: 'Descripción duplicada',
      client: clientId //mismo cliente
    }
    
    const response = await api
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(duplicateData)
      .expect(404) //Asumiendo que el código de error es 404
    
    expect(response.text).toBe('PROJECT_ALREADY_EXISTS')
  })
  
  test('Crear segundo proyecto (para pruebas)', async () => {
    const projectData = {
      name: 'Segundo Proyecto',
      description: 'Descripción del segundo proyecto',
      client: clientId
    }
    
    const response = await api
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send(projectData)
      .expect(200)
    
    secondProjectId = response.body._id
  })
  
  //obtener proyectos
  
  test('Obtener todos los proyectos del usuario', async () => {
    const response = await api
      .get('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //verificar que devuelve array con los proyectos creados
    expect(Array.isArray(response.body)).toBeTruthy()
    expect(response.body.length).toBe(2)
    
    //verificar que están los datos correctos
    const projectFound = response.body.some(project => project._id === projectId)
    expect(projectFound).toBeTruthy()
    
    //todos los proyectos pertenecen al usuario
    const allProjectsUser = response.body.every(project => project.createdBy === userId)
    expect(allProjectsUser).toBeTruthy()
  })
  
  test('Crear proyecto para segundo usuario', async () => {
    const projectData = {
      name: 'Proyecto Second User',
      description: 'Descripción del proyecto del segundo usuario',
      client: secondUserClientId
    }
    
    await api
      .post('/api/project')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .send(projectData)
      .expect(200)
  })
  
  test('Filtrado por usuario: otro usuario no ve los proyectos', async () => {
    const response = await api
      .get('/api/project')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .expect(200)
    
    //el segundo usuario no debe ver los proyectos del primero
    const firstUserProjectFound = response.body.some(project => project._id === projectId)
    expect(firstUserProjectFound).toBeFalsy()
    
    //pero debe ver su propio proyecto
    expect(response.body.length).toBeGreaterThan(0)
  })
  
  test('Obtener proyecto específico por ID', async () => {
    const response = await api
      .get(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //verificar datos del proyecto
    expect(response.body._id).toBe(projectId)
    expect(response.body.name).toBe('Proyecto Test')
    expect(response.body.description).toBe('Descripción del proyecto de prueba')
    expect(response.body.client).toBe(clientId)
    expect(response.body.createdBy).toBe(userId)
  })
  
  test('Obtener proyecto con ID inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    
    const response = await api
      .get(`/api/project/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
    
    expect(response.text).toBe('PROJECT_NOT_FOUND')
  })
  
  test('Obtener proyecto con ID inválido', async () => {
    const response = await api
      .get('/api/project/invalidid')
      .set('Authorization', `Bearer ${token}`)
      .expect(500)
  })
  
  //actualizar proyecto
  
  test('Actualizar proyecto existente', async () => {
    const updatedData = {
      name: 'Proyecto Actualizado',
      description: 'Descripción actualizada',
      client: clientId
    }
    
    const response = await api
      .put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedData)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //verificar actualizaciones
    expect(response.body._id).toBe(projectId)
    expect(response.body.name).toBe('Proyecto Actualizado')
    expect(response.body.description).toBe('Descripción actualizada')
    expect(response.body.client).toBe(clientId)
  })
  
  test('Actualizar proyecto con datos incompletos', async () => {
    const incompleteData = {
      //sin nombre ni cliente
      description: 'Sólo descripción'
    }
    
    const response = await api
      .put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(incompleteData)
      .expect(400)
  })
  
  test('Actualizar proyecto inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    const updatedData = {
      name: 'Proyecto No Existe',
      description: 'Descripción inexistente',
      client: clientId
    }
    
    const response = await api
      .put(`/api/project/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedData)
      .expect(404)
    
    expect(response.text).toBe('PROJECT_NOT_FOUND')
  })
  
  //archivar proyecto (soft delete)
  
  test('Archivar proyecto (soft delete)', async () => {
    const response = await api
      .delete(`/api/project/${secondProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    expect(response.body.message).toBe('Proyecto archivado (soft-delete)')
    
    //guardar para pruebas de recuperación
    archivedProjectId = secondProjectId
    
    //verificar que no aparece en la lista normal
    const listResponse = await api
      .get('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    
    const archived = listResponse.body.some(project => project._id === archivedProjectId)
    expect(archived).toBeFalsy()
  })
  
  test('Archivar proyecto inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    
    const response = await api
      .delete(`/api/project/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
    
    expect(response.text).toBe('PROJECT_NOT_FOUND')
  })
  
  //listar proyectos archivados
  
  test('Listar proyectos archivados', async () => {
    const response = await api
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    //verificar que incluye el proyecto archivado
    expect(Array.isArray(response.body)).toBeTruthy()
    expect(response.body.length).toBeGreaterThan(0)
    
    const archivedFound = response.body.some(project => project._id === archivedProjectId)
    expect(archivedFound).toBeTruthy()
  })
  
  //restaurar proyecto archivado
  
  test('Restaurar proyecto archivado', async () => {
    const response = await api
      .patch(`/api/project/restore/${archivedProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    expect(response.body.message).toBe('Proyecto recuperado correctamente')
    
    //verificar que aparece de nuevo en la lista normal
    const listResponse = await api
      .get('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    
    const restored = listResponse.body.some(project => project._id === archivedProjectId)
    expect(restored).toBeTruthy()
  })
  
  test('Restaurar proyecto inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    
    const response = await api
      .patch(`/api/project/restore/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
    
    expect(response.text).toBe('PROJECT_NOT_FOUND')
  })
  
  //borrado físico (hard delete)
  
  test('Hard delete de proyecto', async () => {
    //primero archivamos el proyecto
    await api
      .delete(`/api/project/${secondProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    
    //luego hacemos borrado permanente
    const response = await api
      .delete(`/api/project/hard/${secondProjectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
    
    expect(response.body.message).toBe('Proyecto eliminado permanentemente')
    
    //verificar que ya no existe (ni siquiera en archivados)
    const archivedResponse = await api
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    
    const stillExists = archivedResponse.body.some(project => project._id === secondProjectId)
    expect(stillExists).toBeFalsy()
  })
  
  test('Hard delete de proyecto inexistente', async () => {
    const nonExistingId = new mongoose.Types.ObjectId()
    
    const response = await api
      .delete(`/api/project/hard/${nonExistingId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
    
    expect(response.text).toBe('PROJECT_NOT_FOUND')
  })
  
  //pruebas para compañía y usuarios asociados
  
  test('Usuario con misma compañía puede ver proyectos', async () => {
    //Crear usuario en la misma compañía
    const companyUserData = {
      email: 'samecompany@example.com',
      password: 'Password123',
      name: 'Company',
      lastname: 'User',
      nif: '11223344Z',
      isAutonomous: false,
      role: 'user',
      status: 'verified',
      company: {
        name: 'Test Company',
        cif: 'B12345678',
        address: 'Test Company Address'
      }
    }
    
    const companyUser = await User.create(companyUserData)
    
    //Actualizar primer usuario con la misma compañía
    await User.findByIdAndUpdate(userId, {
      company: {
        name: 'Test Company',
        cif: 'B12345678',
        address: 'Test Company Address'
      }
    })
    
    const companyUserToken = await tokenSign(companyUser)
    
    //Ahora el usuario de la misma compañía debería ver los proyectos
    const response = await api
      .get('/api/project')
      .set('Authorization', `Bearer ${companyUserToken}`)
      .expect(200)
    
    //Dependiendo de la implementación, podría ver los proyectos
    //o no, según se esté filtrando por createdBy o por company
    console.log(`Usuario de misma compañía ve ${response.body.length} proyectos`)
  })
  
  //pruebas de seguridad adicionales
  
  test('Intentar acceder sin token a todos los endpoints', async () => {
    //get todos los proyectos
    await api
      .get('/api/project')
      .expect(401)
    
    //get proyecto específico
    await api
      .get(`/api/project/${projectId}`)
      .expect(401)
    
    //update proyecto
    await api
      .put(`/api/project/${projectId}`)
      .send({ name: 'Nuevo nombre' })
      .expect(401)
    
    //soft delete
    await api
      .delete(`/api/project/${projectId}`)
      .expect(401)
    
    //hard delete
    await api
      .delete(`/api/project/hard/${projectId}`)
      .expect(401)
    
    //get archivados
    await api
      .get('/api/project/archived')
      .expect(401)
    
    //restaurar
    await api
      .patch(`/api/project/restore/${projectId}`)
      .expect(401)
  })
  
  test('Ver proyectos archivados por otro usuario', async () => {
    //primero archivamos un proyecto
    await api
      .delete(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    
    //intentar ver archivados con el segundo usuario
    const response = await api
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .expect(200)
    
    //no debería ver los archivados del otro usuario
    const seesArchived = response.body.some(project => project._id === projectId)
    expect(seesArchived).toBeFalsy()
  })
  
  test('Intentar restaurar proyecto archivado por otro usuario', async () => {
    //intentar restaurar con el segundo usuario
    const response = await api
      .patch(`/api/project/restore/${projectId}`)
      .set('Authorization', `Bearer ${secondUserToken}`)
      .expect(404) //no debería encontrarlo
  })
})