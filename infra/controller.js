import {
  InternalServerError,
  MethodNotAllowed,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";
import sessions from "models/sessions";
import * as cookie from "cookie";

function noMatchHandler(request, response) {
  const publicError = new MethodNotAllowed();
  response.status(publicError.statusCode).json(publicError);
}

function errorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError
  ) {
    console.log(error);
    return response.status(error.statusCode).json(error);
  }

  const publicError = new InternalServerError({
    cause: error,
  });

  console.error(publicError);

  response.status(publicError.statusCode).json(publicError);
}

function setSessionCookie(token, response) {
  const setCookie = cookie.serialize("session_id", token, {
    path: "/",
    maxAge: sessions.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.setHeader("Set-Cookie", setCookie);
}

const controller = {
  errorHandlers: {
    onNoMatch: noMatchHandler,
    onError: errorHandler,
  },
  setSessionCookie,
};

export default controller;
