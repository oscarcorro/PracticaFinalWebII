const express = require("express")
const {authMiddleware} = require("../middleware/authMiddleware")
const {createProject, updateProject, getProjects, getProject, archiveProject, deleteProject, listArchivedProjects, restoreProject} = require("../controllers/project")
const {validatorCreateProject, validatorUpdateProject} = require("../validators/projectValidator")
const router = express.Router()

//Crear un proyecto
router.post("/", authMiddleware, validatorCreateProject, createProject)
//Actualizar un proyecto
router.put("/:id", authMiddleware, validatorUpdateProject, updateProject)
//Obtener todos los proyectos del usuario/cliente
router.get("/", authMiddleware, getProjects)
//Obtener un proyecto por id
router.get("/:id", authMiddleware, getProject)
//Archivar un proyecto (soft-delete)
router.delete("/:id", authMiddleware, archiveProject)
//elminar un proyecto (hard-delete)
router.delete("/hard/:id", authMiddleware, deleteProject)
//listar proyectos archivados
router.get("/archived", authMiddleware, listArchivedProjects)
//recuperar un proyecto archivado
router.patch("/restore/:id", authMiddleware, restoreProject)

module.exports = router