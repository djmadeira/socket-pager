'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('uuid');
var _ = require('lodash');

var socketPool = {};
var waitingSockets = [];
var activeSockets = {};

app.use(express.static('dist'));

function sendDigitToBuddy(digit) {
    console.log(this.conn.id, 'sending digit to buddy');
    if (typeof digit !== 'number') {
        return;
    }

    if (activeSockets[this.conn.id]) {
        socketPool[activeSockets[this.conn.id]].emit('receive-digit', digit);
    }
}

io.on('connection', function(socket){
    console.log('connected', socket.conn.id);
    socketPool[socket.conn.id] = socket;

    lookForBuddy(socket);

    socket.on('disconnect', handleDisconnect);
});

function lookForBuddy(socket) {
    if (waitingSockets.length > 0) {
        let buddyID = waitingSockets.shift();
        let buddy = socketPool[buddyID];

        console.log('connecting buddies', socket.conn.id, buddyID);

        activeSockets[buddyID] = socket.conn.id;
        activeSockets[socket.conn.id] = buddyID;

        socket.on('send-digit', sendDigitToBuddy);
        buddy.on('send-digit', sendDigitToBuddy);

        socket.emit('buddy-connected');
        buddy.emit('buddy-connected');
    } else {
        console.log('adding', socket.conn.id, 'to waiting list');
        waitingSockets.push(socket.conn.id);
    }
}

function handleDisconnect(){
    let connID = this.conn.id
    console.log(connID, 'disconnected');
    delete socketPool[connID];
    _.remove(waitingSockets, function(val) {
        return val === connID;
    });

    if (activeSockets[connID]) {
        let buddyID = activeSockets[connID];
        delete activeSockets[connID];
        delete activeSockets[buddyID];

        socketPool[buddyID].emit('buddy-disconnected');
        socketPool[buddyID].removeListener('send-digit', sendDigitToBuddy);
        lookForBuddy(socketPool[buddyID]);
    }
};

http.listen(3000, function(){
  console.log('listening on *:3000');
});
