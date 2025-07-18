import { Subject } from 'rxjs';
import { WebClient } from '../WebClient';
import { KeepAliveService } from './KeepAliveService';
import { StatusEnum, WebSocketConnectOptions } from 'src/types';
import { updateStatus } from '../commands/session/updateStatus';

export class WebSocketService {
  // create a socket with WebSocket Type
  private socket!: WebSocket;

  // webclient with WebClient type from server/WebClient
  private webClient: WebClient;
  //this service sends pings to keep the connection alive and lets you know if you're disconnected
  private keepAliveService: KeepAliveService;

  //other parts of the app can use this to know what the message is
  public message$: Subject<MessageEvent> = new Subject();

  //stores the ping interval
  private keepalive!: number;

  constructor(webClient: WebClient) {
    this.webClient = webClient;

    //pass this WebSocketService as the websocket the KeepAliveService needs to use internally
    this.keepAliveService = new KeepAliveService(this);
    //subscribe to the disconnected$ stream to know if disconnected
    this.keepAliveService.disconnected$.subscribe(() => {
      this.disconnect();
    });
  }

  public connect(options: WebSocketConnectOptions, protocol: string = 'wss'): void {
    //if this window is running locally, protocol should be ws
    if (window.location.hostname === 'localhost') {
      protocol = 'wss';
    }

    // deconstruct options and get the host and port values
    const { host, port } = options;
    //set the ping interval to the one in clientOptions
    this.keepalive = this.webClient.clientOptions.keepalive;
    //create the actual socket connection, HARDCODED
    this.socket = this.createWebSocket(`${protocol}://server.cockatrice.us:443/servatrice`);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
  }

  //function that creates and returns a websocket for the class to use
  public createWebSocket(url: string): WebSocket {
    const socket = new WebSocket(url);
    //will allow socket to handle binary data
    socket.binaryType = 'arraybuffer';

    //if this connection doesnt open within the interval, close it
    const connectionTimer = setTimeout(() => socket.close(), this.keepalive);

    socket.onopen = () => {
      //clear the connectionTimer
      clearTimeout(connectionTimer);

      //update the app status to connected
      updateStatus(StatusEnum.CONNECTED, 'Connected');

      //start the keepaliveservice
      this.keepAliveService.startPingLoop(this.keepalive, (pingReceived: Function) => {
        this.webClient.keepAlive(pingReceived);
      });
    };

    socket.onclose = () => {
      //when the connection closes:

      //update the status to DISCONNECTED
      if (this.webClient.status !== StatusEnum.DISCONNECTED) {
        updateStatus(StatusEnum.DISCONNECTED, 'Connection Closed');
      }

      //end the keep alive service loop
      this.keepAliveService.endPingLoop();
    };

    socket.onerror = (err) => {
      //log that there was an error
      console.log('Websocket error', err);
    };

    socket.onmessage = (event: MessageEvent) => {
      //just logging the message
      console.log('Socket Message: ', event);
      // When a message is received:
      this.message$.next(event);
      // Emit the message to any subscribers.
    };

    return socket;
  }

  //method to send a message back to the socket
  public send(message: any): void {
    this.socket?.send(message);
  }

  public checkReadyState(state: number): boolean {
    return this.socket?.readyState === state;
  }
}
