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
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const {storage} = require('./cloudinary.js')
const upload = multer({storage});

let imgfile;


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
    rooms : [{roomname : "CommonRoom", n:0 }, { roomname: usernam , n:0}],
    prooms : []
  })
  user.save().then(user => {
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
    const chatdata = await Room.findOne({roomname: "CommonRoom"});  //Remove it
    const allrooms = await Room.find();
    res.render('user', { user: data, roomdata: chatdata, allrooms: allrooms });
  } catch (err) {
    res.render('login',{ message: "Error retrieving data! Try again with correct credentials." });
  }
});


var users = 0;
io.on('connection', async (socket)=>{
  users++;
  io.sockets.emit('online', {text:users + " online"});
  socket.join("CommonRoom")
  socket.on('joinall', async (data)=>{
    var userdata = await User.findOne({username: data});
    for (let i = 0; i < userdata.rooms.length; i++) {
      socket.join(userdata.rooms[i].roomname);
    }
    for (let i = 0; i < userdata.prooms.length; i++) {
      socket.join(userdata.prooms[i].roomname);
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
            members: [data.user],
            createdby: data.user,
            admin: data.user
          })
          createdroom = await room.save();
        }
      if(roomdata || createdroom) {
        socket.join(data.room);
        if (!userdata.rooms.some(room => room.roomname == data.room)) {
          userdata.rooms.push({roomname: data.room,n:0});
          roomdata.members.push(data.user);
          socket.emit("joined",data.room);
        }
        const updatedData = await userdata.save();
        const updatedRoom = await roomdata.save();
        if(!updatedData || !updatedRoom){
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
          userdata.prooms.push({roomname: data.room, n:0});
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
        let user = await User.findOne({username: data.username});
        if(user){
          user.rooms.some(room=>{
            if(room.roomname == data.roomname){
              room.n=0;
            }
          })
          await user.save();
        }
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
        let user = await User.findOne({username: data.username});
        if(user){
          user.prooms.some(room=>{
            if(room.roomname == data.roomname){
              room.n=0;
            }
          })
          await user.save();
        }
      }
    } catch(err) {
      console.log(err);
    }
  })
  socket.on('adduser', async (data)=>{
    try{
      const user = await User.findOne({username: data.user});
      if(user){
        const room = await Proom.findOne({roomname : data.roomname});
        if(room.members.includes(data.user)){
          socket.emit('addusererr',{success: "User is already Added!"});
          return;
        }
        user.prooms.push({roomname:data.roomname, n:0});
        await user.save();
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
    socket.in(data.toroom).emit('n+',data.toroom);
    var chat = new Chat({
      username : data.user,
      text : data.text
    })
    var roomdata = new Room;
    roomdata = await Room.findOne({roomname : data.toroom});
    if(roomdata){
      roomdata.chats.push(chat);
      const roomd = await roomdata.save();
      for (let i = 0; i < roomd.members.length; i++) {
        if(roomd.members[i] == data.user)continue;
        let user = await User.findOne({username: roomd.members[i]});
        user.rooms.some(room=>{if(room.roomname == roomd.roomname){room.n+=1;}});
        await user.save();
      }
    }
    var proomdata = new Proom;
    proomdata = await Proom.findOne({roomname : data.toroom});
    if(proomdata){
      proomdata.chats.push(chat);
      const proomd = await proomdata.save();
      for (let i = 0; i < proomd.members.length; i++) {
        if(proomd.members[i] == data.user)continue;
        let user = await User.findOne({username: proomd.members[i]});
        user.prooms.some(room=>{if(room.roomname == proomd.roomname)room.n+=1});
        await user.save();
      }
    }
  })
  cloudinary.config({ 
    cloud_name: 'djrzg20q4', 
    api_key: '894362325429518', 
    api_secret: 'uJWNP0vR8sa1m9sffvP3u6BX6ww' 
  });
  
  socket.on('uploadimg',async (file, callback) => {
    console.log(file);
    await fs.writeFileSync("image.jpg", file);
    await cloudinary.uploader.upload(
      "image.jpg",
      function(error, result) {console.log(result); socket.emit('uploaded',result)}
    );
  })
  /* function uploaded(data){
    console.log(imgfile);
    socket.emit('uploaded', data);
  }
  app.post('/upload', upload.single('uploadfile'), async (req, res) => {
    imgfile = req.file;
    uploaded(imgfile);
  }) */
  socket.on('disconnect',function(){
    users--;
    io.sockets.emit('online',{text:users+" online"})
  })
})


var PORT = process.env.PORT || 3000
http.listen(PORT,()=>{
  console.log(`listening on http://localhost:${PORT}`);
})
