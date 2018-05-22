const tmi = require('twitch-js')
const api = require('../api')
const logger = require('../logger')

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

// Connect the client to the server..
client.connect()

client.on('subscription', async (channel, username, method, message, userstate) => {
  console.log(`subscription detected, firing lights ${username}`)
  logger.info(`subscription detected, firing lights ${username}`)
  await api.subscriberFlash()
})

client.on('subgift', async (channel, username, recipient, method, userstate) => {
  console.log(`subscription detected, firing lights ${username}`)
  logger.info(`subscription detected, firing lights ${username}`)
  await api.subscriberFlash()
})

client.on('cheer', async (channel, userstate, message) => {
  await api.cheerFlash(userstate.bits)
})

client.on('chat', async (channel, userstate, message, self) => {
  // Don't listen to my own messages..
  if (self) return

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
  } else if (message === '!help') {
    await client.say(channel, 'Use !defectors to list the defectors')
  }
})
