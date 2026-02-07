

var ws : WebSocket;

function initWSConnection(Module : any) {
    
    ws = new WebSocket("ws://localhost:9002/test");
    ws.onopen =  () => {
        console.log("Connected to Server!")
    };
    ws.onclose =  () => {
        console.log("Disconnected from Server!")
    }
    ws.onmessage = (ev : MessageEvent) => {
        console.log("Received msg from server: ", ev.data);
        const msg_json = JSON.parse(ev.data);
        if(msg_json["type"] == "client_id")
        {
            Module["client_id"] = msg_json["client_id"];
        }else{
            Module.ccall("receiveMessage", null, ["string"], [ev.data]); 
        }
    }
    ws.onerror = (ev : Event) =>{
        console.log("Websocket ERROR");
    }
}