const mongoose = require('mongoose')
const User = require('./user')

const listSchema = new mongoose.Schema({
  list: {
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

const List = mongoose.model('List', listSchema)

module.exports = List
