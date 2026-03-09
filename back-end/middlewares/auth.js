const config = require('../config/app.config.js');
const jwt = require('jsonwebtoken');

function obterAuthorization(req) {
  return String(req.headers.authorization || '').trim();
}

function extrairTokenBearer(authorization) {
  if (!authorization.startsWith('Bearer ')) {
    return null;
  }

  const jwtToken = authorization.split(' ')[1];
  return jwtToken ? String(jwtToken).trim() : null;
}

function validarJWT(req, res, next) {
  const authorization = obterAuthorization(req);

  if (!authorization) {
    return res.status(401).send({
      message: "Token ausente."
    });
  }

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).send({
      message: "Formato de token invalido."
    });
  }

  const jwt_token = extrairTokenBearer(authorization);
  if (!jwt_token) {
    return res.status(401).send({
      message: "Token ausente."
    });
  }

  jwt.verify(jwt_token, config.jwtSecret, (err, userInfo) => {
    if (err) {
      console.log(err);
      if (err.name === "TokenExpiredError") {
        return res.status(401).send({
          message: "Token Expirado."
        });
      }
      return res.status(403).send({
        message: "Token invalido"
      });
    }
    req.user = userInfo;
    return next();
  });
}

function validarJWTOpcional(req, _res, next) {
  const authorization = obterAuthorization(req);
  const jwtToken = extrairTokenBearer(authorization);

  if (!jwtToken) {
    return next();
  }

  jwt.verify(jwtToken, config.jwtSecret, (err, userInfo) => {
    if (!err && userInfo) {
      req.user = userInfo;
    }
    return next();
  });
}

validarJWT.opcional = validarJWTOpcional;

module.exports = validarJWT;
