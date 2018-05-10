
const api = require('./api')
const TwitchBot = require('twitch-bot')
const logger = require('./logger')

const channel = 'hackingtv'

const Bot = new TwitchBot({
  username: 'defectorbot',
  oauth: process.env.OAUTH_TOKEN,
  channels: [channel]
})

Bot.on('join', channel => {
  logger.info(`Joined channel: ${channel}`)
})

Bot.on('error', err => {
  logger.error('something happened to the bot in twitch', err)
})

Bot.on('part', channel => {
  logger.info(`leaving the channel ${channel}`)
  Bot.join(channel)
})

Bot.on('join', channel => {
  logger.info(`joining the channel ${channel}`)
})

Bot.on('message', async chatter => {
  if(chatter.message === '!defectors') {
    let defectors = await api.getDefectors()

    Bot.say(`The Defectors: ${defectors}`)
  } else if (chatter.message === '!help') {
    Bot.say('Use !defectors to list the defectors')
  }
})

module.exports = Bot