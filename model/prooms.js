const mongoose = require('mongoose')

const roomScema = new mongoose.Schema({
  roomname : {
    type : String,
    unique : true
  },
  chats :{
    type : Array
  },
  members:{
    type: Array
  },
  createdby:{
    type : String
  },
  admin: {
    type : Array
  },
  date : {
    type : Date,
    default : Date.now()
  }
})

const Prooms = mongoose.model('Prooms', roomScema);
module.exports = Prooms