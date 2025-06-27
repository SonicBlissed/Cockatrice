/**
 * This file simply sends periodic pings to keep the connection alive
 */

import { Subject } from "rxjs";

import { WebSocketService } from "./WebSocketService";

export class KeepAliveService {
    private socket: WebSocketService

    //timer that sends the pings
    private keepalivecb: NodeJS.Timeout | undefined;
    private lastPingPending!: boolean;

    //so that other parts of the app can know if youve been disconnected
    public disconnected$ = new Subject<void>();

    //when this service is instantiated, give it a socket connection to use internally
    constructor(socket: WebSocketService) {
        this.socket = socket
    }

    //function that starts the loop, doesnt return anything
    public startPingLoop(interval: number, ping: Function): void {
        this.keepalivecb = setInterval(() => {
            if (this.lastPingPending) { 
                //if the last ping is still pending, disconnect
                this.disconnected$.next()
            }

            // if websocket is not open (disconnected), exit the ping loop
            if (!this.socket.checkReadyState(WebSocket.OPEN)) {
                this.endPingLoop();
                return;
            }

            this.lastPingPending = true;
            //send a ping, and when pong is received set ping pending to false
            ping(() => this.lastPingPending = false)
        }, interval)
    }

    //function to end the ping loop
    public endPingLoop(){
        clearInterval(this.keepalivecb);
        this.keepalivecb = undefined;
        this.lastPingPending = false;
    }
}