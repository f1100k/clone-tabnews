import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import password from "models/password.js";
import { UnauthorizedError } from "infra/errors.js";

const routes = createRouter();

routes.post(postHandler);

export default routes.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  try {
    const storedUser = await user.findOneByEmail(userInputValues.email);

    const correctPasswordMatch = await password.compare(
      userInputValues.password,
      storedUser.password,
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se este dado está correto.",
      });
    }
  } catch (error) {
    throw new UnauthorizedError({
      message: "Os dados fornecidos não conferem.",
      action: "Verifique se os dados fornecidos estão corretos.",
      cause: error,
    });
  }

  return response.status(201).json({});
}
