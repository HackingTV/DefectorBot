const sqlite = require('sqlite')

const dbPromise = Promise.resolve()
  .then(() => sqlite.open('./database.sqlite', { Promise }))
  //.then(db => db.migrate({ force: 'last' }))

module.exports = dbPromise
