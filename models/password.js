import bcrypt from "bcryptjs";

function getNumberOfRounds() {
  return process.env.NODE_ENV === "production" ? 14 : 1;
}

async function hashPasswordInObject(user) {
  const rounds = getNumberOfRounds();
  const salt = await bcrypt.genSalt(rounds);
  const hashedPassowrd = await bcrypt.hash(user.password, salt);
  user.password = hashedPassowrd;
}

async function compare(string, hash) {
  return await bcrypt.compare(string, hash);
}

const password = {
  hashPasswordInObject,
  compare,
};

export default password;
