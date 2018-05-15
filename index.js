require('dotenv').config()
const server = require('./server')
const CronJob = require('cron').CronJob;
const api = require('./api')
const logger = require('./logger')

const updateDatabase = async () => {
  let followers = await api.getUsersFromFollowers()

  let users = followers.map(user => ({
    id: user.id,
    username: user.display_name
  }))

  let result = users.map(user => api.saveUser(user))

  return true
}

const init = async () => (
  await Promise.all([api.subscribeToFollowerHook(), updateDatabase()])
)

const cronJobFunc = async () => {
  logger.info('cronjob is running')
  let defectors = await api.getDefectors
  defectors.map(defector => api.saveDefector(defector))
  await init()
}

const job = new CronJob('00 00 23 * * *', cronJobFunc, () => logger.error('cron job failed'), true, 'America/Toronto')

init()