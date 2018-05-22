const axios = require('axios')
const dbPromise = require('./db')
const logger = require('./logger')

const myTwitchID = process.env.TWITCH_ID

const subscribeToFollowerHook = async () => {
  return axios.post('https://api.twitch.tv/helix/webhooks/hub', {
      "hub.mode": "subscribe",
      "hub.topic": `https://api.twitch.tv/helix/users/follows?first=1&to_id=${myTwitchID}`,
      "hub.callback": "https://www.whentokens.com/follower/callback",
      "hub.lease_seconds": 864000
    },{
    headers: {
      'Client-ID': process.env.CLIENT_ID
    }
  })
}

const subscribeToStreamUpDownHook = async () => {
  return axios.post('https://api.twitch.tv/helix/webhooks/hub', {
      "hub.mode": "subscribe",
      "hub.topic": `https://api.twitch.tv/helix/streams?user_id=${myTwitchID}`,
      "hub.callback": "https://www.whentokens.com/updown/callback",
      "hub.lease_seconds": 864000
    },{
    headers: {
      'Client-ID': process.env.CLIENT_ID
    }
  })
}

const getFollowers = (cursor) => {
  let params = {
    to_id: myTwitchID,
    first: 100
  }

  if (cursor) params.after = cursor

  return axios.get('https://api.twitch.tv/helix/users/follows', {
    params,
    headers: {
      'Client-ID': process.env.CLIENT_ID
    }
  })
  .then(res => res.data)
  .catch(err => console.log(err))
}

const subscriberFlash = () => {
  return axios.get(process.env.LIGHT_API + '/subscriber')
}

const followerFlash = () => {
  return axios.get(process.env.LIGHT_API + '/follower')
}

const cheerFlash = amount => {
  return axios.get(`${process.env.LIGHT_API}/cheer/${amount}`)
}

const getUsersFromFollowers = async (cursor) => {
  let followers = await getFollowers(cursor)

  if (followers.data.length === 0) {
    return []
  }

  let usernames = await getUsernamesForIds(followers.data.map(follower => follower.from_id))
  return usernames.concat(await getUsersFromFollowers(followers.pagination.cursor))
}

const getUsernamesForIds = (ids) => {
  return axios.get('https://api.twitch.tv/helix/users', {
    params: {
      id: ids
    },
    headers: {
      'Client-ID': process.env.CLIENT_ID
    }
  })
  .then(res => res.data.data)
  .catch(err => console.log(err))
}

const saveUser = async (user) => {
  const db = await dbPromise
  return await db.exec(`INSERT INTO users VALUES ("${user.id}","${user.username}")`)
}

const saveDefector = async (user) => {
  const db = await dbPromise
  logger.info('saving user', user)
  return await db.exec(`INSERT INTO defectors VALUES ("${user.id}","${user.username}", DATETIME())`)
}

const getFollowersInDatabase = async () => {
  const db = await dbPromise
  return await db.all('SELECT * FROM users')
}

const getDefectors = async () => {
  const db = await dbPromise

  // get followers from database
  let dbFollowers = await db.all('SELECT * FROM users')

  // Get followers from twitch
  let followers = await getUsersFromFollowers()

  // return the diff between both
  return dbFollowers
    .filter(dbFollower => {
      return !followers.some(follower => follower.id === dbFollower.id.toString())
    })
}

module.exports = {
  cheerFlash,
  subscriberFlash,
  followerFlash,
  subscribeToFollowerHook,
  subscribeToStreamUpDownHook,
  getFollowers,
  getUsersFromFollowers,
  getUsernamesForIds,
  getFollowersInDatabase,
  saveUser,
  saveDefector,
  getDefectors
}
