
const api = require('./api')
const TwitchBot = require('twitch-bot')

const Bot = new TwitchBot({
  username: 'defectorbot',
  oauth: process.env.OAUTH_TOKEN,
  channels: ['hackingtv']
})

Bot.on('join', channel => {
  console.log(`Joined channel: ${channel}`)
})

Bot.on('error', err => {
  console.log(err)
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