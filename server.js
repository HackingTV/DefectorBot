const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const dbPromise = require('./db')
const api = require('./api')
const logger = require('./logger')
const discordBot = require('./bots/discordbot')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('go away')
})

app.get('/updown/callback', (req, res) => {
  logger.info(`call from twitch to subscribe ${req.query}`)
  res.send(req.query['hub.challenge'])
})

app.post('/updown/callback', (req, res) => {
  logger.info('call about stream stuff', req.body)
  if (req.body.data.length) {
    discordBot.announcement(`${req.body.data[0].title} https://www.twitch.tv/hackingtv`)
  }
  res.send(req.body)
})

app.get('/follower/callback', (req, res) => {
  logger.info(`call from twitch to subscribe ${req.query}`)
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
    await api.followerFlash()
    logger.log(`Saving user to database Followers table ${userToSave[0]}`)
    res.send(req.body)
  } catch (err) {
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
  res.json((await api.getDefectors()).map(defector => defector.username))
})

app.listen(process.env.PORT || 3000, () => logger.log('DefectorBot listening on port 3000!'))

module.exports = app