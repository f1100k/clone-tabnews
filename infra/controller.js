import {
  InternalServerError,
  MethodNotAllowed,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";

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

const controller = {
  errorHandlers: {
    onNoMatch: noMatchHandler,
    onError: errorHandler,
  },
};

export default controller;
