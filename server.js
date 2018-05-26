const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const bodyParser = require('body-parser')
const api = require('./api')
const logger = require('./logger')
const discordBot = require('./bots/discordbot')
const path = require('path')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/static', express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.send('go away')
})

app.get('/updown/callback', (req, res) => {
  logger.info(`Subscribing to Stream Up/Down Webhook ${JSON.stringify(req.query)}`)
  res.send(req.query['hub.challenge'])
})

app.post('/updown/callback', (req, res) => {
  logger.info(`call about stream stuff ${JSON.stringify(req.body)}`)
  if (req.body.data.length) {
    discordBot.announcement(`@here ${req.body.data[0].title} https://www.twitch.tv/hackingtv`)
  }
  res.send(req.body)
})

app.get('/follower/callback', (req, res) => {
  logger.info(`Subscribing to Follower Webhook ${JSON.stringify(req.query)}`)
  res.send(req.query['hub.challenge'])
})

app.post('/follower/callback', async (req, res) => {
  let userData = await api.getUsernamesForIds([req.body.data[0].from_id])
  let userToSave = userData.map(user => ({
    id: user.id,
    username: user.display_name
  }))

  try {
    await api.saveUser(userToSave[0])
    logger.info(`Saving user to database Followers table ${JSON.stringify(userToSave[0])}`)
    await api.followerFlash()
    logger.info('fired lights!')
    io.emit('follow', userToSave[0].username)
    logger.info('fired widget!')
    res.send(req.body)
  } catch (err) {
    console.log(err)
    logger.error(err)
    res.sendStatus(500)
  }
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

// app.get('/testFollow/:name', (req, res) => {
//   io.emit('follow', req.params.name)
//   res.sendStatus(200)
// })

// app.get('/testSubscribe/:name', (req, res) => {
//   io.emit('subscribe', req.params.name)
//   res.sendStatus(200)
// })

app.get('/widgets/alert', (req, res) => {
  res.sendFile(path.join(__dirname, './widgets/alert', 'index.html'))
})

http.listen(process.env.PORT || 3000, () => logger.log('DefectorBot listening on port 3000!'))

module.exports = {
  app,
  io
}