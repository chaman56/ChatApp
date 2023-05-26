const messages    = document.getElementById("messages")
const textinput   = document.getElementById("textinput");
const onlin       = document.getElementById("online");
const roomname    = document.getElementById("roomname");
const name        = document.getElementById("name");
const messageBody = document.querySelector("#messageArea");
const joinedrooms = document.querySelector(".joinedrooms")
const rooms       = document.getElementById("rooms");
const joinnew     = document.getElementById("joinnew");
const welcome     = document.getElementById("welcome");


function showrooms(){
    rooms.setAttribute("class","rooms");
    joinnew.setAttribute("class", "none");
}
function showjoinnew(){
    joinnew.setAttribute("class","rooms");
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
async function getinside(it){
  await socket.emit("getroom",{roomname:it.innerHTML,username:name.innerHTML})
  roomname.innerHTML = it.innerHTML;
  if(window.innerWidth < 1000)
  rooms.setAttribute("class", "none");
}

if(window.innerWidth < 1000)
  welcome.style.display = "none";

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
    const nam = document.createElement("span");
    nam.innerHTML+=roomdata.chats[i].username + "  &nbsp; ";
    nam.setAttribute("class","name");
    span.appendChild(nam);
    span.innerHTML += roomdata.chats[i].text;
    if(roomdata.chats[i].username==name.innerHTML){
    span.style.background = 'rgb(131, 211, 136)';
    p.style.textAlign = "right";
    }
  }
  messageBody.scrollTop = messageBody.scrollHeight;
})
function send(){
  socket.emit('message', {text : textinput.value,user:name.innerHTML,toroom:roomname.innerHTML});
  textinput.value = '';
}
addEventListener("keyup",(e)=>{
  if(e.keyCode == 13)
  send();
})