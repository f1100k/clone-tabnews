import {
  InternalServerError,
  MethodNotAllowed,
  NotFoundError,
  ValidationError,
} from "infra/errors";

function noMatchHandler(request, response) {
  const publicError = new MethodNotAllowed();
  response.status(publicError.statusCode).json(publicError);
}

function errorHandler(error, request, response) {
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return response.status(error.statusCode).json(error);
  }

  const publicError = new InternalServerError({ statusCode: error.statusCode,
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
