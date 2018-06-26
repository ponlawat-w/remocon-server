const CONFIG = require('./config.json');

const Express = require('express');
const Https = require('https');
const Http = require('http');
const WebSocketServer = require('ws').Server;
const URL = require('url');
const File = require('fs');

const credentials = {
    key: File.readFileSync('./ssl/key.pem'),
    cert: File.readFileSync('./ssl/cert.pem')
};

const senderServer = Http.createServer(new Express());
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
        if (msg === "RECEVIERS_COUNT") {
            ws.send(wsReceiverServer.clients.size);
            return;
        }

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

    ws.on('message', (msg) => {
        if (msg === "SENDERS_COUNT") {
            ws.send(wsSenderServer.clients.size);
            return;
        }

        wsSenderServer.clients.forEach((ws) => {
            ws.send(msg);
        });

        console.log(`Forward message to sender: ${msg}`);
    });
});

senderServer.listen(CONFIG.senderPort, () => {
    console.log(`Sender server started on port ${CONFIG.senderPort}`);
});

receiverServer.listen(CONFIG.receiverPort, () => {
    console.log(`Receiver server started on port ${CONFIG.receiverPort}`);
});