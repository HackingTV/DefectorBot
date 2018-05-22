require('dotenv').config()
const CronJob = require('cron').CronJob;
const server = require('./server') // Need this to start express
const api = require('./api')
const logger = require('./logger')
const twitchBot = require('./bots/twitchbot')

const updateDatabase = async () => {
  let followers = await api.getUsersFromFollowers()

  let users = followers.map(user => ({
    id: user.id,
    username: user.display_name
  }))

  users.map(user => api.saveUser(user))

  return true
}

const init = async () => (
  await Promise.all([
    api.subscribeToFollowerHook(),
    api.subscribeToStreamUpDownHook(),
    updateDatabase()
  ])
)

// TODO: Fix Defector saving
const cronJobFunc = async () => {
  logger.info('cronjob is running')
  let defectors = await api.getDefectors()
  defectors.map(defector => api.saveDefector(defector))
  await init()
}

new CronJob('00 00 23 * * *', cronJobFunc, () => logger.error('cron job failed'), true, 'America/Toronto')

init()