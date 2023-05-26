const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  firstname : {
    type : String
  },
  lastname : {
    type : String
  },
  email : {
    type : String,
    required : true,
    unique : true
  },
  username : {
    type : String,
    required : true,
    unique : true
  },
  password :{
    type: String,
    required:true
  },
  messages:{
    type : Array
  },
  rooms :{
    type : Array
  },
  date : {
    type : Date,
    default : Date.now()
  }
})

const User = mongoose.model('User', userSchema);
module.exports = User