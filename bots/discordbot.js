const Discord = require('discord.js')
const client = new Discord.Client()
const api = require('../api')

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', async msg => {
  if (msg.content === '!defectors') {
    try {
      let defectors = await api.getDefectorsFromDB()
      if (defectors.length) {
        msg.reply(`The Defectors: ${defectors.map(defector => defector.username)}`)
      } else {
        msg.reply('No Defectors this week! :POGGERS:')
      }
    } catch (err) {
      console.log('error is ',err)
    }
  } else if (msg.content === '!help') {
    msg.reply('Use !defectors to list the defectors')
  }
});

client.login(process.env.DISCORD_TOKEN)

const announcement = message => client.channels.get('444515499343347712').send(message)

module.exports = {
  announcement
}