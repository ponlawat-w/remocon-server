const CONFIG = require('./config.json');

const Express = require('express');
const Http = require('http');
const WebSocketServer = require('ws').Server;

const senderServer = Http.createServer(new Express());
const receiverServer = Http.createServer(new Express());

const wsSenderServer = new WebSocketServer({
    server: senderServer,
    path: '/sender'
});
const wsReceiverServer = new WebSocketServer({
    server: receiverServer,
    path: '/receiver'
});

wsSenderServer.broadcast = (message) => {
    wsSenderServer.clients.forEach((client) => {
        client.send(message);
    });
};

wsReceiverServer.broadcast = (message) => {
    wsReceiverServer.clients.forEach((client) => {
        client.send(message);
    });
};

wsReceiverServer.broadcastAmount = (senderServer) => {
    const amount = wsReceiverServer.clients.size;
    senderServer.broadcast(`RECEIVERS=${amount}`);
};

wsSenderServer.on('connection', (ws) => {
    console.log('A sender has connected');
    wsReceiverServer.broadcastAmount(wsSenderServer);

    ws.on('close', () => {
        console.log('A sender has disconnected');
    });

    ws.on('message', (msg) => {
        if (msg === "RECEVIERS_COUNT") {
            ws.send(wsReceiverServer.clients.size);
            return;
        }

        wsReceiverServer.broadcast(msg);
        console.log(`Forward message to receiver: ${msg}`);
    });
});

wsReceiverServer.on('connection', (ws) => {
    console.log('A receiver has connected');
    wsReceiverServer.broadcastAmount(wsSenderServer);
    
    ws.on('close', () => {
        console.log('A receiver has disconnected');
        wsReceiverServer.broadcastAmount(wsSenderServer);
    });

    ws.on('message', (msg) => {
        if (msg === "SENDERS_COUNT") {
            ws.send(wsSenderServer.clients.size);
            return;
        }

        wsSenderServer.broadcast(msg);
        console.log(`Forward message to sender: ${msg}`);
    });
});

senderServer.listen(CONFIG.senderPort, () => {
    console.log(`Sender server started on port ${CONFIG.senderPort}`);
});

receiverServer.listen(CONFIG.receiverPort, () => {
    console.log(`Receiver server started on port ${CONFIG.receiverPort}`);
});
