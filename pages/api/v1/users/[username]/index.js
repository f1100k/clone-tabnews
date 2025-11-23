import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";

const routes = createRouter();

routes.get(getHandler);

export default routes.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const result = await user.findOneByUsername(request.query.username);
  return response.status(200).json(result);
}
