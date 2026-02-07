
import { motion } from "framer-motion";
import { GameState, type GameStateT } from './Game'

import { type ConnectionInfo, type ConnectionStateT } from "./Lobby";

type ConnectionInfoTableProps = {
    info: ConnectionInfo,
    setGameState: (state: GameStateT) => void,
    Module: any,
};

function ConnectionInfoTable({ info, setGameState, Module }: ConnectionInfoTableProps) {
    const { latency, clientId, clientName, state } = info;


    const stateColor: Record<ConnectionStateT, string> = {
        CONNECTED: "bg-green-500",
        CONNECTING: "bg-yellow-500",
        DISCONNECTED: "bg-red-500",
    };

    const onStart = () => {
        if (info.state == "CONNECTED") {
            setGameState("RUNNING");
            Module._startGame(3);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onStart}
            className="p-4 rounded-xl shadow border bg-black w-full max-w-sm grid gap-3"
        >
            <h2 className="text-lg font-semibold">Connection Info</h2>


            <div className="grid gap-1 text-base">
                <div className="flex justify-between">
                    <span className="font-medium">Client Name:</span>
                    <span>{clientName}</span>
                </div>


                <div className="flex justify-between">
                    <span className="font-medium">Client ID:</span>
                    <span>{clientId}</span>
                </div>


                <div className="flex justify-between">
                    <span className="font-medium">Latency:</span>
                    <span>{latency} ms</span>
                </div>


                <div className="flex justify-between">
                    <span className="font-medium">State:</span>
                    <span>{state}</span>
                </div>
            </div>
        </motion.div>
    );

}

export default ConnectionInfoTable