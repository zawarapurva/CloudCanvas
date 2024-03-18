const bcrypt = require('bcrypt')

const getUserPasswordAuth = (authHeader) => {
  const decodedBasicToken = Buffer.from(authHeader.split(' ')[1], 'base64')
    .toString('ascii')
    .split(':')
  const username = decodedBasicToken[0]
  const password = decodedBasicToken[1]
  return { username, password }
}

const hashPassword = async (password, saltRounds) => {
  const hashedPassword = bcrypt.hashSync(password,saltRounds);
  return hashedPassword
}

const comparePassword = async (password, hashedPassword) => {
  const passwordCheck = await bcrypt.compare(password, hashedPassword)
  return passwordCheck
}

module.exports = { getUserPasswordAuth, hashPassword, comparePassword }
