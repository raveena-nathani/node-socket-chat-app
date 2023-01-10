const path = require('path')
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users'); 

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000; 

 //__dirname - gives current file, path.join helps to manipulate the path 
 const publicDirectoryPath = path.join(__dirname,'../public');

 //setup static directory to serve
 app.use(express.static(publicDirectoryPath)); 

 io.on('connection', (socket) => {
    // socket.emit('message', generateMessage('Welcome!') );

    //socket.broadcast.emit -> // broadcast to every other client except the current client 
    // socket.broadcast.emit('message', generateMessage('A new user has joined!')); 


    socket.on('join', ({username, room}, callback ) => {
        const {error, user} = addUser({id: socket.id, username, room});

        if(error){
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin','Welcome!') );
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin ',`${username} has joined the room `)); 
        //io.to.emit -> emits an event to everybody in a specific room
        //socket.broadcast.to.emit -> emits an event to everyone except specific client but it's limited to specific chat room
         

        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback();

    })


    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit("message", generateMessage(user.username,message));
        callback("Message is delivered"); //acknowlegement - sender receives it
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`));
        callback("Location is shared!")
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user){
         io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left!`))
         io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        }
    })
 })

 server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
 });

 




// Counter example
// 
 //client (emit) - server (receive) - increment
 //server (emit) - client (receive) - countUpdated

 //let count = 0;
 /* io.on('connection', (socket) => {
    console.log("New connection established");
    socket.emit('countUpdated', count);

    socket.on('increment', () => {
        count++;

        //socket.emit('countUpdated', count) //emits to single channel
        io.emit('countUpdated', count); //broadcast to every channel
    })
 })*/
