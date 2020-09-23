const mongoose = require('mongoose')
const User = require('./user')

const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

const list = mongoose.model('list', listSchema)

module.exports = list
