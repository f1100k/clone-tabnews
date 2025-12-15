import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import sessions from "models/sessions.js";

const routes = createRouter();

routes.post(postHandler);

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
