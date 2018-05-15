const axios = require('axios')
const dbPromise = require('./db')
const includes = require('array-includes')
const flatten = require('array-flatten')

const myTwitchID = process.env.TWITCH_ID

const subscribeToFollowerHook = async () => {
  return axios.post('https://api.twitch.tv/helix/webhooks/hub', {
      "hub.mode": "subscribe",
      "hub.topic": `https://api.twitch.tv/helix/users/follows?first=1&to_id=${myTwitchID}`,
      "hub.callback": "https://www.whentokens.com/callback",
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
  return await db.exec(`INSERT INTO defectors VALUES ("${user.id}","${user.display_name}", UTC_TIMESTAMP()`)
}

const getFollowersInDatabase = async () => {
  const db = await dbPromise
  return await db.all('SELECT * FROM users')
}

const getDefectors = async () => {
  const db = await dbPromise

  // get followers from database
  let dbFollowers = await db.all('SELECT id FROM users')

  // Get followers from twitch
  let twitchFollowers = await getUsersFromFollowers()
  twitchFollowers = twitchFollowers.map(follower => follower.id)
  // twitchFollowers.splice(0, 2);

  // defectors are users in database and who are not in twitch
  let unfollowers = dbFollowers
    .map(follower => follower.id.toString())
    .filter(followerId => !includes(twitchFollowers, followerId))
    .map(async id => {
      return await getUsernamesForIds(id)
    })

  return Promise.all(unfollowers)
    .then(res => flatten(res))
    .then(res => res.map(obj => obj.display_name))
}

module.exports = {
  subscriberFlash,
  followerFlash,
  subscribeToFollowerHook,
  getFollowers,
  getUsersFromFollowers,
  getUsernamesForIds,
  getFollowersInDatabase,
  saveUser,
  getDefectors
}
