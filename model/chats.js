const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
  username : {
    type : String,
    unique: false
  },
  text : {
    type : String,
    unique : false
  },
  date : {
    type : Date,
    default : Date.now()
  }
})

const Chats = mongoose.model('Chats', chatSchema);
module.exports = Chats