const messages    = document.getElementById("messages")
const textinput   = document.getElementById("textinput");
const onlin       = document.getElementById("online");
const roomname    = document.getElementById("roomname");
const name        = document.getElementById("name");
const messageBody = document.querySelector("#messageArea");
const joinedrooms = document.querySelector(".joinedrooms")
const rooms       = document.getElementById("rooms");
const private     = document.getElementById("private");
const joinnew     = document.getElementById("joinnew");
const welcome     = document.getElementById("welcome");
const aduser      = document.getElementById("adduser");
const adduserinput= document.getElementById("adduserinput");
const userroom    = document.getElementById("userroom");


function showrooms(){
    rooms.setAttribute("class","rooms");
    joinnew.setAttribute("class", "none");
    private.setAttribute("class", "none")
    aduser.setAttribute("class", "none");
}
function showjoinnew(){
    joinnew.setAttribute("class","rooms");
}
function dispublic(){
  private.setAttribute("class", "none")
}
function disprivate(){
  private.setAttribute("class", "rooms")
}
function disadduser(it){
  userroom.innerHTML = it.id;
  aduser.setAttribute("class", "rooms")
}
function backtorooms(){
  aduser.setAttribute("class", "none");
}
function adduser(){
  console.log(userroom.innerHTML)
  socket.emit('adduser', {user: adduserinput.value, adder:name.innerHTML, roomname: userroom.innerHTML});
  adduserinput.value = '';
}
async function jointhisroom(it){
  await socket.emit('joinroom',{room:it.innerHTML,user:name.innerHTML})
  showrooms();
}
async function createjoin(){
  let roomname = document.getElementById("createjoin").value;
  await socket.emit('joinroom',{room:roomname,user:name.innerHTML})
  showrooms();
}
async function privateroom(){
  let roomname = document.getElementById("privateroom").value;
  await socket.emit('privateroom',{room:roomname,user:name.innerHTML})
  //showrooms();
}
async function getinside(it){
  messages.innerHTML = '';
  await socket.emit("getroom",{roomname:it.innerHTML,username:name.innerHTML})
  roomname.innerHTML = it.innerHTML;
  if(window.innerWidth < 1000)
  rooms.setAttribute("class", "none");
}
async function getinsidep(it){
  messages.innerHTML = '';
  await socket.emit("getroomp",{roomname:it.innerHTML,username:name.innerHTML})
  roomname.innerHTML = it.innerHTML;
  if(window.innerWidth < 1000)
  rooms.setAttribute("class", "none");
}


if(window.innerWidth > 1000)
  welcome.style.display = "flex";

var socket =  io();
socket.emit('joinall',name.innerHTML)
socket.on('online',(data)=>{onlin.innerHTML = data.text});
socket.on('broadcast',(data)=>{
  if(roomname.innerHTML == data.toroom){
  const p = document.createElement("div");
  messages.appendChild(p);
  const span = document.createElement("div1")
  p.appendChild(span);
  const name = document.createElement("span");
  name.innerHTML+=data.user + "  &nbsp; ";
  name.setAttribute("class","name");
  span.appendChild(name);
  span.innerHTML += data.text;
  messageBody.scrollTop = messageBody.scrollHeight + span.style.height;
  }
})
socket.on('broadcastme',(data)=>{
  const p = document.createElement("div");
  messages.appendChild(p);
  const span = document.createElement("div1")
  p.appendChild(span);
  span.innerHTML = data.text
  p.style.textAlign = 'right';
  span.style.background = 'rgb(131, 211, 136)';
  messageBody.scrollTop = messageBody.scrollHeight + span.style.height;
})
socket.on('joined',(data)=>{
  let joinedroom = document.createElement("button");
  joinedroom.setAttribute("class","availrooms");
  joinedroom.innerHTML = data;
  joinedroom.setAttribute("onclick","getinside(this)");
  let parent = document.createElement("div");
  parent.setAttribute("style","display: flex;align-items: center;");
  parent.innerHTML = '<div style="height:40px;border-radius: 50%;overflow: hidden; width: 45px;"><img src="boy.png" height="40px" width="40px" alt=""></div>'
  parent.append(joinedroom)
  joinedrooms.prepend(parent);
})
socket.on('foundroom',(roomdata)=>{
  messages.innerHTML = '';
  for (let i = 0; i < roomdata.chats.length; i++) {
    const p = document.createElement("div");
    messages.appendChild(p);
    const span = document.createElement("div1")
    p.appendChild(span);
    let nam = document.createElement("span");
    nam.innerHTML+=roomdata.chats[i].username + "  &nbsp; ";
    nam.setAttribute("class","name");
    span.appendChild(nam);
    span.innerHTML += roomdata.chats[i].text;
    if(roomdata.chats[i].username == name.innerHTML){
      span.style.background = 'rgb(131, 211, 136)';
      p.style.textAlign = "right";
      nam.setAttribute("class","")
    }
  }
  messageBody.scrollTop = messageBody.scrollHeight;
})
socket.on('addusererr',(data)=>{
  const addusererr = document.getElementById("addusererr");
  if(data.err){
    addusererr.innerHTML =' * ' + data.err
    addusererr.style.color = 'red'
  }else{
    addusererr.innerHTML = data.success
    addusererr.style.color = 'green'
  }
})
socket.on('privaterr', (data)=>{
  const privaterr = document.getElementById("privaterr");
  if(data.err){
    privaterr.innerHTML = '* '+ data.err
    privaterr.style.color = 'red'
  }else{
    privaterr.innerHTML = data.success
    privaterr.style.color = 'green'
    let p = document.createElement('div');
    p.innerHTML = `<div style="display: flex;align-items: center;">
                     <div style="height:40px;border-radius: 50%;overflow: hidden; width: 45px;"><img src="boy.png" height="40px" width="40px" alt=""></div>
                     <button class="availrooms" onclick="getinsidep(this)">${data.room.roomname}</button>
                     <button id=${data.room.roomname} onclick="disadduser(this)">+User</button>
                   </div>`;
    document.getElementById("privaterooms").prepend(p);
  }
})



function send(){
  socket.emit('message', {text : textinput.value,user:name.innerHTML,toroom:roomname.innerHTML});
  textinput.value = '';
}
addEventListener("keyup",(e)=>{
  if(e.keyCode == 13)
  send();
})

