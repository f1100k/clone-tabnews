import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import sessions from "models/sessions.js";

const routes = createRouter();

routes.post(postHandler);
routes.delete(deleteHandler);

export default routes.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await sessions.create(authenticatedUser.id);

  controller.setSessionCookie(newSession.token, response);

  return response.status(201).json(newSession);
}

async function deleteHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const sessionObject = await sessions.findOneValidByToken(sessionToken);
  const expiredSessionObject = await sessions.expireById(sessionObject.id);

  controller.clearSessionCookie(response);

  response.status(200).json(expiredSessionObject);
}
