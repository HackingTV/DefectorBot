const tmi = require('twitch-js')
const api = require('../api')
const logger = require('../logger')
const io = require('../server').io
const trivia = require('../trivia')

const channel = 'hackingtv'

const options = {
    connection: {
        reconnect: true
    },
    identity: {
        username: 'defectorbot',
        password: process.env.OAUTH_TOKEN
    },
    channels: [channel]
}

const client = new tmi.client(options)

const handleSubscription = async (channel, username, method, message, userstate) => {
  console.log(`subscription detected, firing lights ${username}`)
  logger.info(`subscription detected, firing lights ${username}`)
  await api.subscriberFlash()
  io.emit('subscribe', username)
}

// Connect the client to the server..
client.connect()

client.on('subscription', handleSubscription)

client.on('subgift', handleSubscription)

client.on('cheer', async (channel, userstate, message) => {
  await api.cheerFlash(userstate.bits)
})

client.on('chat', async (channel, userstate, message, self) => {
  // Don't listen to my own messages..
  if (self) return

  if (trivia.isPlaying()) {
    if (trivia.isAnswer(message)) {
      await client.say(channel, 'CORRECT!')
    }
  }

  if(message === '!defectors') {
    try {
      let defectors = await api.getDefectorsFromDB()
      if (defectors.length) {
        await client.say(channel, `The Defectors: ${defectors.map(defector => defector.username)}`)
      } else {
        await client.say(channel, 'No Defectors this week! POGGERS')
      }
    } catch(err) {
      console.error(err)
      logger.error(err)
    }
  } else if (message === '!trivia' && !trivia.isPlaying()) {
    //return client.say(channel, 'Starting a game of trivia!')
    let question = await trivia.getQuestion()
    await client.say(channel, question)
  } else if (message === '!help') {
    await client.say(channel, 'Use !defectors to list the defectors')
  }
})
