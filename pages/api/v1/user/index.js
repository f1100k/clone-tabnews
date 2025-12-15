import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import sessions from "models/sessions";

const routes = createRouter();

routes.get(getHandler);

export default routes.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const sessionToken = request.cookies.session_id;

  const session = await sessions.findOneValidByToken(sessionToken);
  const renewedSession = await sessions.renew(session.id);
  controller.setSessionCookie(renewedSession.token, response);

  const userFound = await user.findOneById(session.user_id);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  return response.status(200).json(userFound);
}
