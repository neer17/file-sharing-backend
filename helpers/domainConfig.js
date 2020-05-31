const production = process.env.PRODUCTION

//  URL of backend
const url = production === 'true' ? 'https://file-sharing-app-back-end.herokuapp.com' : 'http://localhost:3003'

module.exports = url