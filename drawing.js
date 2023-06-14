var canvas, ctx;
var flag = false, prevX = 0, currX = 0, prevY = 0, currY = 0;
var dot_flag = false;
var x = "black", y = 2;

var clientId = null;
var gameId = null;

var ws = new WebSocket('ws://localhost:9090'); 
const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const txtGameId = document.getElementById("txtGameId");

function init() {
    canvas = document.getElementById('can');
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;

    ws.onmessage = message => {
        //message.data
        const response = JSON.parse(message.data);
        //connect
        if (response.method === "connect"){
            clientId = response.clientId;
            console.log("Client id Set successfully " + clientId)
        }
    
        //create
        if (response.method === "create"){
            gameId = response.game.id;
            console.log("game successfully created with id " + response.game.id)  
        }
    
        //join
        if (response.method === "join"){
            console.log("join " + clientId + " " + gameId);
            const game = response.game;

            canvas.addEventListener("mousemove", function (e) {
                findxy(clientId, gameId, 'move', e)
            }, false);
            canvas.addEventListener("mousedown", function (e) {
                findxy(clientId, gameId, 'down', e)
            }, false);
            canvas.addEventListener("mouseup", function (e) {
                findxy(clientId, gameId, 'up', e)
            }, false);
            canvas.addEventListener("mouseout", function (e) {
                findxy(clientId, gameId, 'out', e)
            }, false);
        }

        if (response.method === "update"){
            const game = response.game;
    
            // Clear the canvas and redraw everything
            ctx.clearRect(0, 0, w, h);
            if (game.state && game.state.drawings) {
                game.state.drawings.forEach(drawData => {
                    const {x1, y1, x2, y2, color} = drawData;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = y;
                    ctx.stroke();
                    ctx.closePath();
                });
            }
        }        
    }

}

function color(obj) {
    switch (obj.id) {
        case "green":
            x = "green";
            break;
        case "blue":
            x = "blue";
            break;
        case "red":
            x = "red";
            break;
        case "yellow":
            x = "yellow";
            break;
        case "orange":
            x = "orange";
            break;
        case "black":
            x = "black";
            break;
        case "white":
            x = "white";
            break;
    }
    if (x == "white") y = 14;
    else y = 2;
}

btnJoin.addEventListener("click", e => {

    if (gameId === null)
        gameId = txtGameId.value;
    
    const payLoad = {
        "method": "join",
        "clientId": clientId,
        "gameId": gameId
    }

    ws.send(JSON.stringify(payLoad));

})

btnCreate.addEventListener("click", e => {

    const payLoad = {
        "method": "create",
        "clientId": clientId
    }

    ws.send(JSON.stringify(payLoad));

})

    function draw(clientId, gameId) {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = x;
        ctx.lineWidth = y;
        ctx.stroke();
        ctx.closePath();

        // Send to server
        const payload = {
            method: 'draw',
            clientId: clientId,
            gameId: gameId,
            x1: prevX,
            y1: prevY,
            x2: currX,
            y2: currY,
            color: x
        };
        ws.send(JSON.stringify(payload));
    }

    function findxy(clientId, gameId, res, e) {
        if (res == 'down') {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - canvas.offsetLeft;
            currY = e.clientY - canvas.offsetTop;

            flag = true;
            dot_flag = true;
            if (dot_flag) {
                ctx.beginPath();
                ctx.fillStyle = x;
                ctx.fillRect(currX, currY, 2, 2);
                ctx.closePath();
                dot_flag = false;
            }
        }
        if (res == 'up' || res == "out") {
            flag = false;
        }
        if (res == 'move') {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = e.clientX - canvas.offsetLeft;
                currY = e.clientY - canvas.offsetTop;
                draw(clientId, gameId);
            }
        }
    }