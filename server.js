const express = require('express');
const app = express();
const mongoose = require('mongoose')
const bodyparser = require('body-parser');
const dotenv = require('dotenv');
const User = require('./model/user');
const Room = require('./model/rooms');
const Proom = require('./model/prooms');
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
    rooms : ["CommonRoom" , usernam],
    prooms : []
  })
  user.save().then(user => {
    console.log(user);
    const room = new Room({
      roomname : user.username,
      chats: [],
      members: [user.username],
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
    for (let i = 0; i < userdata.prooms.length; i++) {
      socket.join(userdata.prooms[i]);
    }
  })
  socket.on('joinroom', async (data) => {
    try {
      const userdata = await User.findOne({ username: data.user });
      const roomdata = await Room.findOne({ roomname: data.room });
      const proomdata = await Proom.findOne({roomname : data.room });
      let createdroom;
        if(!roomdata && !proomdata){
          const room = new Room({
            roomname : data.room,
            chats: [],
            messages: [],
            createdby: data.user,
            admin: data.user
          })
          createdroom = await room.save();
        }
      if(roomdata || createdroom) {
        socket.join(data.room);
        if (!userdata.rooms.includes(data.room)) {
          userdata.rooms.push(data.room);
          socket.emit("joined",data.room);
        }
        const updatedData = await userdata.save();
        if(!updatedData){
          socket.emit('publicerr',{err :"Couldn't join the room! Try Again!"});
          return;
        }
      }else {
        socket.emit('publicerr',{err: 'This room already exist in Private!'});
      }
    }catch (error) {
      socket.emit('publicerr',{err: error});
    }
  });
  socket.on('privateroom', async (data)=>{
    try{
      let proomdata = await Proom.findOne({ roomname: data.room })
      let roomdata =  await Room.findOne( { roomname: data.room })
        if(!roomdata && !proomdata){
          const room = new Proom({
            roomname : data.room,
            chats: [],
            members: [data.user],
            createdby: data.user,
            admin: data.user
          })
          const userdata = await User.findOne({ username: data.user });
          userdata.prooms.push(data.room);
          const updateduser = await userdata.save();
          const updatedroom = await room.save();
          if(!updatedroom || !updateduser){
            socket.emit('privaterr', {err:"Couldn't create the room! Try Again!"});
            return;
          }else{
            socket.emit('privaterr', {success:"Room Created Successfully!", room:updatedroom});
          }
        }else{
          socket.emit('privaterr', {err: "Room with this name already exits!"});
        }
    }catch (error) {
      socket.emit('privaterr', {err: error});
      console.log(error);
    }
  })
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
  socket.on('getroomp', async (data)=>{
    try{
      const roomdata = await Proom.findOne({roomname : data.roomname});
      if(roomdata){
        socket.emit('foundroom',roomdata);
      }
    } catch(err) {
      console.log(err);
    }
  })
  socket.on('adduser', async (data)=>{
    try{
      const user = await User.findOne({username: data.user});
      if(user){
        user.prooms.push(data.roomname);
        await user.save();
        const room = await Proom.findOne({roomname : data.roomname});
        if(room.members.includes(data.user)){
          socket.emit('addusererr',{success: "User is already Added!"});
          return;
        }
        room.members.push(data.user);
        await room.save();
        socket.emit('addusererr',{success: "User Added Successfully!"});
      }else{
        socket.emit('addusererr',{err: "User doesn't exitst!"});
      }
    }catch(error){
      socket.emit('addusererr',{err: error})
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
      await roomdata.save();
    }
    var proomdata = new Proom;
    proomdata = await Proom.findOne({roomname : data.toroom});
    if(proomdata){
      proomdata.chats.push(chat);
      await proomdata.save();
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
