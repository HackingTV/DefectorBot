const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const dbPromise = require('./db')
const api = require('./api')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('go away')
})

app.get('/callback', (req, res) => {
  console.log(req.query)
  res.send(req.query['hub.challenge'])
})

app.post('/callback', async (req, res) => {
  let userData = await api.getUsernamesForIds([req.body.data[0].from_id])
  let userToSave = userData.map(user => ({
    id: user.id,
    username: user.display_name
  }))

  await api.saveUser(userToSave[0])
  console.log(userToSave[0])
  res.send(req.body)
})

app.get('/followers', async (req, res) => {
  res.json(await api.getFollowersInDatabase())
})

app.get('/newFollowers', async (req, res) => {
  res.json(await api.getFollowersRecursed())
})

app.get('/defectors', async (req, res) => {
  res.json(await api.getDefectors())
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))

module.exports = app