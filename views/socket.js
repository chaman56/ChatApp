var socket = io();
  socket.on('online',(data)=>{onlin.innerHTML = data.text});
  
  socket.on('broadcast',(data)=>{
    const p = document.createElement("div");
    messages.appendChild(p);
    const span = document.createElement("div1")
    p.appendChild(span);
    const name = document.createElement("span");
    name.innerHTML+=data.user + '<br>';
    name.setAttribute("class","name");
    span.appendChild(name);
    span.innerHTML += data.text;
    span.style.background = 'aqua'
    span.style.paddingTop = '0px';
    messageBody.scrollTop = messageBody.scrollHeight + span.style.height;
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
  function send(){
    socket.emit('message', {text : textinput.value,user:name.innerHTML});
    textinput.value = '';
  }
  addEventListener("keyup",(e)=>{
    if(e.keyCode == 13)
    send();
  })