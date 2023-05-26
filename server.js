const express = require('express');
const app = express();
const mongoose = require('mongoose')
const bodyparser = require('body-parser');
const dotenv = require('dotenv');
const User = require('./model/user');
const Room = require('./model/rooms');
const Chat = require('./model/chats');
const http = require('http').Server(app);
const io = require('socket.io')(http);


app.use(bodyparser.urlencoded({extended:true}))
dotenv.config({path: 'config.env'})
app.set("view engine","ejs");
app.use(express.static("public") );

const connectDB = async ()=>{
  try{
    const con = await mongoose.connect(process.env.mongourl,{
      useNewUrlParser:true,
      useUnifiedTopology:true,
    })
    console.log(`mongodb connected :${con.connection.host}`)
  }catch(err){
    console.log(err)
    process.exit(1)
  }
}
connectDB();

app.get('/',(req, res)=>{
  res.render('login');
})
app.get('/login',(req, res)=>{
  res.render('login');
})
app.get('/signup',(req, res)=>{
  res.render('signup');
})
app.post('/adduser', (req,res)=>{
  if(!req.body){
    res.render('signup', {message : "Can not send empty request!"});
    return;
  }let usernam = req.body.username;
  const user = new User({
    firstname : req.body.firstname,
    lastname : req.body.lastname,
    email : req.body.email,
    username : req.body.username,
    password : req.body.password,
    messages : [],
    rooms : ["CommonRoom" , usernam]
  })
  user.save().then(user => {
    console.log(user);
    const message = new Chat({
      username:"Chaman",
      text : `Hello ${user.firstname}! Welcome to Our Chatting Application.`
    })
    const room = new Room({
      roomname : user.username,
      chats: [],
      messages: [message],
      createdby: user.username,
      admin: user.username
    })
    room.save().then(()=>{
      res.redirect('login')
    });
  }).catch(err=>{
    res.render('signup', {message : "User already exists!" ||  err.message || "Some error occured while creating!"} );
  })
})

app.get('/chat', async (req, res) => {
  const username = req.query.username;
  const password = req.query.password;
  try {
    const data = await User.findOne({ username: username, password: password });
    if (!data) {
      res.render('login', { message: "Invalid login credentials!" });
      return;
    }
    const chatdata = await Room.findOne({roomname: "CommonRoom"});
    const allrooms = await Room.find();
    res.render('user', { user: data, roomdata: chatdata, allrooms: allrooms });
  } catch (err) {
    res.render('login',{ message: "Error retrieving data! Try again with correct credentials." });
  }
});


var users = 0;
io.on('connection',async (socket)=>{
  users++;
  io.sockets.emit('online', {text:users + " online"});
  socket.join("CommonRoom")
  socket.on('joinall', async (data)=>{
    var userdata = await User.findOne({username: data});
    for (let i = 0; i < userdata.rooms.length; i++) {
      socket.join(userdata.rooms[i]);
    }
  })
  socket.on('joinroom', async (data) => {
    try {
      const userdata = await User.findOne({ username: data.user });
      await Room.findOne({ roomname: data.room }).then(roomdata =>{
        if(!roomdata){
          const room = new Room({
            roomname : data.room,
            chats: [],
            messages: [],
            createdby: data.user,
            admin: data.user
          })
          room.save();
        }
      })
      if (userdata) {
        socket.join(data.room);
        if (!userdata.rooms.includes(data.room)) {
          userdata.rooms.push(data.room);
          socket.emit("joined",data.room);
        }
        const updatedData = await userdata.save();
        if(!updatedData){
          res.send({message:"Couldn't join the room! Try Again!"});
          return;
        }
      } else {
        console.log('User not found.');
      }
    }catch (err) {
      console.log(err);
    }
  });
  socket.on('getroom', async (data)=>{
    try{
      const roomdata = await Room.findOne({roomname : data.roomname});
      if(roomdata){
        socket.emit('foundroom',roomdata);
      }
    } catch(err) {
      console.log(err);
    }
  })
  socket.on('message', async (data)=>{
    socket.emit('broadcastme',data);
    socket.in(data.toroom).emit('broadcast', data);
    var chat = new Chat({
      username : data.user,
      text : data.text
    })
    var roomdata = new Room;
    roomdata = await Room.findOne({roomname : data.toroom});
    if(roomdata){
      roomdata.chats.push(chat);
      roomdata.save();
    }
  })
  
  socket.on('disconnect',function(){
    users--;
    io.sockets.emit('online',{text:users+" online"})
  })
})

var PORT = process.env.PORT || 3000
http.listen(PORT,()=>{
  console.log(`listening on http://localhost:${PORT}`);
})
