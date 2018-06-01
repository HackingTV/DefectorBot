const tmi = require('twitch-js')
const api = require('../api')
const logger = require('../logger')
const io = require('../server').io
const trivia = require('../trivia')

const channel = 'hackingtv'
const username = 'hackingtv'

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
  io.emit('alert', api.createAlertObject({ type: 'subscribe', name: username }))
}


// Connect the client to the server..
client.connect()

client.on('subscription', handleSubscription)

client.on('subgift', handleSubscription)

client.on('resub', function(
  channel,
  username,
  months,
  message,
  userstate,
  methods,
) {
  handleSubscription(channel, username, null, message, userstate)
})

client.on('cheer', async (channel, userstate, message) => {
  await api.cheerFlash(userstate.bits)
  io.emit('alert', api.createAlertObject({ type: 'cheer', name: userstate['display-name'], amount: userstate.bits}))
})

client.on('chat', async (channel, userstate, message, self) => {
  // Don't listen to my own messages..
  if (self) return

  if (trivia.isPlaying()) {
    logger.info('trivia playing', trivia.isPlaying())
    if (trivia.isAnswer(message)) {
      await client.say(channel, 'CORRECT!')
      await api.triviaFlash()
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
  } else if (message === '!github') {
    await client.say(channel, 'https://github.com/HackingTV')
  } else if (message === '!trivia') {
    if (trivia.isPlaying()) {
      return await client.say(channel, 'A game of trivia is already in progress.')
    }

    let question = await trivia.getQuestion()
    await client.say(channel, question)
  } else if (message === '!discord') {
    await client.say(channel, 'https://discord.gg/kGYNaVQ')
  } else if (message === '!help') {
    await client.say(channel, 'Use !defectors, !discord, !trivia')
  }
})
