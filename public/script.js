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
const backbtn     = document.getElementById("backbtn");
const member      = document.getElementById("members");
const memberbtn   = document.getElementById("memberbtn");
let flag = 0;

function showrooms(){
    rooms.setAttribute("class","rooms");
    joinnew.setAttribute("class", "none");
    private.setAttribute("class", "none")
    aduser.setAttribute("class", "none");
    roomname.innerHTML = '';
}

function showjoinnew(){
    joinnew.setAttribute("class","rooms");
}
function dispublic(){
  private.setAttribute("class", "none")
}
function disprivate(){
  rooms.setAttribute("class","rooms");
  private.setAttribute("class", "rooms")
  backbtn.setAttribute("onclick", "showrooms()");
  roomname.innerHTML = '';
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
  const unread = document.querySelector(`.${it.innerHTML}`);
  unread.innerHTML = '';
  if(window.innerWidth < 1000)
  rooms.setAttribute("class", "none");
}
async function getinsidep(it){
  messages.innerHTML = '';
  await socket.emit("getroomp",{roomname:it.innerHTML,username:name.innerHTML})
  roomname.innerHTML = it.innerHTML;
  const unread = document.querySelector(`.${it.innerHTML}`);
  unread.innerHTML = '';
  if(window.innerWidth < 1000)
  rooms.setAttribute("class", "none");
  backbtn.setAttribute("onclick","disprivate()");
}
function dismembers(){
  if(roomname.innerHTML!=''){
    member.className = "members";
    memberbtn.setAttribute("onclick","hidemembers()");
  }else{
    member.className = "members";
    memberbtn.setAttribute("onclick","hidemembers()");
    const userinfo = document.getElementById("userdata");
    member.innerHTML = userinfo.innerHTML;
    member.style.textAlign = "center"
  }
}
function hidemembers(){
  member.className = "none";
  memberbtn.setAttribute("onclick","dismembers()");
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
  p.style.padding= 3+"px";
  p.innerHTML =  `
    <div style="background-color: white;text-align: left;display: inline-block;padding: 8px 10px;border-radius: 10px;max-width: 70%;">
      <div>
        <div class="name" style="color: rgb(255, 85, 0);">
          <div>${data.user}</div>
        </div>
        <div class="text">
          ${data.text}
        </div>
        <div style="color: gray;text-align:right;font-size:9px;">now</div>
      </div>
    </div>
  `;
    messageBody.scrollTop = messageBody.scrollHeight + p.style.height;
    setTimeout(function() {
      messageBody.scrollTop = messageBody.scrollHeight;
    }, 500);
    setTimeout(function() {
      messageBody.scrollTop = messageBody.scrollHeight;
    }, 1100);
  }
})
socket.on('broadcastme',async(data)=>{
  const p = document.createElement("div");
  messages.appendChild(p);
  p.style.padding= 3+"px";
  p.innerHTML =  `
    <div style="background-color: rgb(217, 255, 215);text-align: left;display: inline-block;padding: 8px 10px;border-radius: 10px;max-width: 70%;">
      <div>
        <div class="text">
          ${data.text}
        </div>
      </div>
    </div>
  `;
  p.style.textAlign = "right";
  messageBody.scrollTop = messageBody.scrollHeight + p.style.height;
  setTimeout(function() {
    messageBody.scrollTop = messageBody.scrollHeight;
  }, 500);
  setTimeout(function() {
    messageBody.scrollTop = messageBody.scrollHeight;
  }, 1100);
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
  let span = document.createElement("span");
  span.setAttribute("class",data);
  span.setAttribute("id","n");
  parent.append(span);
  joinedrooms.prepend(parent);
})
socket.on('foundroom', async (roomdata)=>{
  messages.innerHTML = '';
  member.innerHTML = `<h3>Created By</h3><p>${roomdata.createdby}</p><h3>Members</h3><hr>`;
  for (let i = 0; i < roomdata.members.length; i++) {
    const element = document.createElement("p");
    element.innerHTML = roomdata.members[i];
    member.append(element);
  }
  for (let i = 0; i < roomdata.chats.length; i++) {
    let time = roomdata.chats[i].date.substr(11,5);
    const p = document.createElement("div");
    p.style.padding= 3+"px";
    messages.appendChild(p);
    if(roomdata.chats[i].username != name.innerHTML){
      p.innerHTML =  `
        <div style="background-color: white;text-align: left;display: inline-block;padding: 8px 10px;border-radius: 10px;max-width: 70%;">
          <div>
            <div class="name" style="color: rgb(255, 85, 0);">
              <div>${roomdata.chats[i].username}</div>
            </div>
            <div class="text">
              ${roomdata.chats[i].text}
            </div>
            <div style="color: gray;text-align:right;font-size:9px;">${time}</div>
          </div>
        </div>
      `
    }else{
      p.style.textAlign = "right"
      p.innerHTML =  `
        <div style="background-color: rgb(217, 255, 215);text-align: left;display: inline-block;padding: 8px 10px;border-radius: 10px;max-width: 70%;">
          <div>
            <div class="text">
              ${roomdata.chats[i].text}
            </div>
            <div style="color: gray;text-align:right;font-size:9px;">${time}</div>
          </div>
        </div>
      `
    }
  }
  messageBody.scrollTop = messageBody.scrollHeight;
  setTimeout(function() {
    messageBody.scrollTop = messageBody.scrollHeight;
  }, 500);
  setTimeout(function() {
    messageBody.scrollTop = messageBody.scrollHeight;
  }, 1100);
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

socket.on('n+', (data)=>{
  const unread = document.querySelector(`.${data}`);
  let x = unread.innerHTML;
  if(x=='')x=0;
  unread.innerHTML = parseInt(x) + 1;
  if(data == roomname.innerHTML)
  unread.innerHTML = '';
})


function upload(files) {
 if(files[0].size > 1000045){
    alert("Image Size Must be smaller than 1 Mb!");
    this.value = "";
 }else{
  socket.emit("uploadimg", files[0], (status) => {
    console.log(status);
  });
 }
}

function send(){
  socket.emit('message', {text : textinput.value,user:name.innerHTML,toroom:roomname.innerHTML});
  textinput.value = '';
}
socket.on('uploaded', (file)=>{
  console.log(file);
  socket.emit('message', {text : `<a href="${file.url}" ><img id="imageload" style="max-width:100%;" src="${file.url}" alt=""></a>`,user:name.innerHTML,toroom:roomname.innerHTML});
  textinput.value = '';
})

addEventListener("keyup",(e)=>{
  if(e.keyCode == 13 && textinput.value!='')
  send();
})


$(document).on('submit','#uploadFile',function(e){
  e.preventDefault();
  var formData = new FormData(this);
  socket.emit('uploadimg', formData);
});
