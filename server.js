const CONFIG = require('./config.json');

const Express = require('express');
const Https = require('https');
const WebSocketServer = require('ws').Server;
const URL = require('url');
const File = require('fs');

const credentials = {
    key: File.readFileSync('./ssl/key.pem'),
    cert: File.readFileSync('./ssl/cert.pem')
};

const senderServer = Https.createServer(credentials, new Express());
const receiverServer = Https.createServer(credentials, new Express());

const wsSenderServer = new WebSocketServer({
    server: senderServer,
    path: '/sender'
});
const wsReceiverServer = new WebSocketServer({
    server: receiverServer,
    path: '/receiver'
});

wsSenderServer.on('connection', (ws) => {
    console.log('A sender has connected');

    ws.on('close', () => {
        console.log('A sender has disconnected');
    });

    ws.on('message', (msg) => {
        wsReceiverServer.clients.forEach((ws) => {
            ws.send(msg);
        });

        console.log(`Forward message to receiver: ${msg}`);
    });
});

wsReceiverServer.on('connection', (ws) => {
    console.log('A receiver has connected');
    
    ws.token = null;

    ws.on('close', () => {
        console.log('A receiver has disconnected');
    });
});

senderServer.listen(CONFIG.senderPort, () => {
    console.log(`Sender server started on port ${CONFIG.senderPort}`);
});

receiverServer.listen(CONFIG.receiverPort, () => {
    console.log(`Receiver server started on port ${CONFIG.receiverPort}`);
});