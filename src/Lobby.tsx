import { useEffect, useState } from 'react'
import { AppState, type AppStateT } from './shared.ts';
import { GameState, type GameStateT } from './Game.tsx';
import ConnectionInfoTable from './ConnectionInfoTable.tsx'

var serverList: URL[] = [new URL("ws://localhost:9002/test")];

export const ConnectionState = {
    Connecting: "CONNECTING",
    Disconnected: "DISCONNECTED",
    Connected: "CONNECTED",
} as const;
export type ConnectionStateT = typeof ConnectionState[keyof typeof ConnectionState];

export type ConnectionInfo = {
    latency: number,
    clientId: number,
    clientName: string,
    state: ConnectionStateT,
    socket: WebSocket,
};


type LobbyProps = {
    setAppState: (state: AppStateT) => void;
    setGameState: (state: GameStateT) => void;
    Module: any;
};

function Lobby({ setAppState, setGameState, Module }: LobbyProps) {

    const [connections, setConnections] = useState<Map<URL, ConnectionInfo>>(new Map<URL, ConnectionInfo>());

    function setNewConnState(serverURL: URL, newState: ConnectionStateT) {

        setConnections(connections => {
            const newConns = new Map(connections);
            const oldInfo = connections.get(serverURL);
            if (oldInfo) {
                oldInfo.state = newState;
                newConns.set(serverURL, oldInfo);
            }
            return newConns;
        });
    }

    function initWSConnection(Module: any, serverURL: URL) {
        const ws = new WebSocket(serverURL);
        const info: ConnectionInfo = {
            latency: 0,
            clientId: -1,
            clientName: "TestName",
            state: ConnectionState.Connecting,
            socket: ws
        };

        setConnections(connections => {
            const newConns = new Map(connections);
            newConns.set(serverURL, info);
            return newConns;
        })
        let opened = false;

        ws.onopen = () => {
            opened = true;

            Module.sendControlMessage = (msg: string) => {
                if (ws) {
                    ws.send(msg);
                }
            }

            const pingMsg = { type: "ping", time: Date.now() };
            ws.send(JSON.stringify(pingMsg));

            setNewConnState(serverURL, ConnectionState.Connected);
            console.log("Connected to Server:", serverURL.href);
        };
        ws.onclose = (ev) => {
            const failedInitialConnect = !opened;

            setNewConnState(serverURL, ConnectionState.Disconnected);
            console.log(
                failedInitialConnect
                    ? "Failed to connect to server:"
                    : "Disconnected from server:",
                serverURL.href,
                ev.reason
            );
        };
        ws.onmessage = (ev: MessageEvent) => {
            // console.log("Received msg from server: ", ev.data);
            const msg_json = JSON.parse(ev.data);
            if (msg_json["type"] == "client_id") {
                Module["client_id"] = msg_json["client_id"];
            } else if (msg_json["type"] == "ping") {
                const sendTime = msg_json["time"];
                setConnections(pica => {
                    const novaPica = new Map(pica);
                    const newInfo = pica.get(serverURL);
                    if (newInfo) {
                        newInfo.latency = Date.now() - sendTime;
                        novaPica.set(serverURL, newInfo)
                    }
                    return novaPica;
                });
                setTimeout(() => {
                    msg_json["time"] = Date.now();
                    ws.send(JSON.stringify(msg_json));
                }, 1000);
            } else {
                Module.ccall("receiveMessage", null, ["string"], [ev.data]);
            }
        }
        ws.onerror = (error: Event) => {
            console.log("Websocket ERROR", error);
            setNewConnState(serverURL, ConnectionState.Disconnected);
        }

        return info;
    }

    useEffect(() => {
        serverList.forEach((url) => {
            const info = initWSConnection(Module, url);
        });
    }, [])

    useEffect((
    ) => { }, [connections])

    return (

        <div className="flex flex-col items-center justify-center h-[90vh] space-y-6">
            <button onClick={() => setGameState(GameState.Menu)}>
                Back
            </button>
            {
                Array.from(connections.entries()).map(([url, connection], id) => {
                    return <ConnectionInfoTable key={id} info={connection} setGameState={setGameState} Module={Module} />
                })
            }
        </div>
    )
}

export default Lobby;