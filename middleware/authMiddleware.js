const { verifyToken } = require("../utils/handleJwt");
const { handleHttpError } = require("../utils/handleError");

//middleware que solicita la autenticación con token
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]

        if (!token)
            return handleHttpError(res, "TOKEN_REQUIRED", 401)

        const decoded = verifyToken(token)

        if (!decoded)
            return handleHttpError(res, "INVALID_TOKEN", 401)

        req.user = decoded
        next()
    } catch (error) {
        handleHttpError(res, "AUTH_ERROR", 401)
    }
}

module.exports = { authMiddleware };
