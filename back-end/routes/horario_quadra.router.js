const express = require("express");
const { criarGradeHorariosController, listarGradeController } = require("../controllers/horario_quadra.controller");
const validarJWT = require("../middlewares/auth");
const router = express.Router();

router.post("/grade-horarios", [validarJWT], criarGradeHorariosController);

router.get("/grade-horarios/:quadraId", [validarJWT], listarGradeController);

router.get("/public/grade-horarios/:quadraId", listarGradeController);

module.exports = router;
