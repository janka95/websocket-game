const http = require("http");
const websocketServer = require("websocket").server;

const app = require("express")();
app.get("/", (req,res)=> res.sendFile(__dirname + "/index.html"))
app.listen(9091, ()=>console.log("Listening on http port 9091"))

const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening on 9090"));

const clients = {};
const games = {};

const wsServer = new websocketServer({
    "httpServer": httpServer
});

wsServer.on("request", request => {
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data);

        if (result.method === "create") {
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "clients": []
            }

            const payLoad = {
                "method": "create",
                "game" : games[gameId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        if (result.method === "join") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];

            game.clients.push({
                "clientId": clientId,
            })

            updateGameState();

            const payLoad = {
                "method": "join",
                "game": game
            }

            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            })
        }

        if (result.method === "draw") {
            const clientId = result.clientId;
            const gameId = result.gameId;
            const x1 = result.x1;
            const y1 = result.y1;
            const x2 = result.x2;
            const y2 = result.y2;
            const color = result.color;
        
            var state = games[gameId].state;
            if (!state)
                state = {};
        
            //store drawings
            if (!state.drawings)
                state.drawings = [];
        
            state.drawings.push({clientId, x1, y1, x2, y2, color});
            games[gameId].state = state;
        
            updateGameState();
        }
    })

    const clientId = guid();
    clients[clientId] = {
        "connection":  connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    connection.send(JSON.stringify(payLoad));
});

function updateGameState() {
    for (const g of Object.keys(games)) {
        const game = games[g]
        const payLoad = {
            "method": "update",
            "game": game
        }

        game.clients.forEach(c => {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }
}     

function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
//globally-unique identifier
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();