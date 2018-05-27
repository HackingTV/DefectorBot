const axios = require('axios')
const logger = require('../logger')
const API_URL = 'http://jservice.io'

let state = {
  CURRENT_QUESTION: {},
  IS_PLAYING: false,
  TIMEOUT: null
}

const getRandomQuestionAPI = () => (
  axios.get(API_URL + '/api/random')
    .then(res => res.data[0])
)

const getQuestion = async () => {
  let question = await getRandomQuestionAPI()
  question.answer = (question.answer).replace(/[^a-zA-Z\d\s]/g,'')

  state.CURRENT_QUESTION = question
  state.IS_PLAYING = true
  state.TIMEOUT = setTimeout(() => {
    // Nobody ansnwered the question at this point so.. gg
    state.IS_PLAYING = false
  }, 1000 * 60)

  return state.CURRENT_QUESTION.question
}

const isAnswer = answer => {
  logger.info('answer to check is', state.CURRENT_QUESTION.answer)
  if (answer.toLowerCase() === state.CURRENT_QUESTION.answer.toLowerCase()) {
    state.IS_PLAYING = false
    clearTimeout(state.TIMEOUT)
    return true
  }

  return false
}

const isPlaying = () => {
  return state.IS_PLAYING
}

module.exports = {
  getQuestion,
  isAnswer,
  isPlaying
}
