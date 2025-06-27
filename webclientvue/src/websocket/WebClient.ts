/**
 * This file manages the websocket connection for the web app
 * Protobuf: Method of serializing structured data
 */

import { StatusEnum, WebSocketConnectOptions } from 'src/types';
import { ProtobufService } from './services/ProtobufService';
import { WebSocketService } from './services/WebSocketService';
// import { SessionPersistence } from './persistence/SessionPersistence';
// import { RoomPersistence } from './persistence/RoomPersistence';

export class WebClient {
  //creates the WebSocketService instance the manage the connection (sending, pinging, connection)
  public socket = new WebSocketService(this);
  public protobuf = new ProtobufService(this);

  public protocolVersion = 14;
  //stores information about the client (version, supported features)
  public clientConfig = {
    clientid: 'webatrice',
    clientver: 'webclient-1.0 (2019-10-31)',
    clientfeatures: [
      'client_id',
      'client_ver',
      'feature_set',
      'room_chat_history',
      'client_warnings',
      /* unimplemented features */
      'forgot_password',
      'idle_client',
      'mod_log_lookup',
      'user_ban_history',
      // satisfy server reqs for POC
      'websocket',
      '2.7.0_min_version',
      '2.8.0_min_version',
    ],
  };

  //stores options for the client (auto joining, and keepalive interval)
  public clientOptions = {
    autojoinrooms: true,
    keepalive: 5000,
  };

  public options!: WebSocketConnectOptions;
  public status!: StatusEnum;

  public connectionAttemptMade = false;

  constructor() {
    //whenever a message is received, send it to the protobuf
    this.socket.message$.subscribe((message: MessageEvent) => {
      this.protobuf.handleMessageEvent(message);
    });

    //logging the instance to the console
    if (process.env.NODE_ENV !== 'test') {
      console.log(this);
    }
  }

  public connect(options: WebSocketConnectOptions) {
    //update attempt made
    this.connectionAttemptMade = true;

    //save the connection options
    this.options = options;

    //start the websocket connection using the options provided
    this.socket.connect(options);
  }

  public disconnect() {
    this.socket.disconnect();
  }

  public updateStatus(status: StatusEnum) {
    // update the current connection instances status
    this.status = status;

    if (status === StatusEnum.DISCONNECTED) {
      //reset commands and clear stores if disconnect
      this.protobuf.resetCommands();
      this.clearStores();
    }
  }

  public keepAlive(pingReceived: Function) {
    this.protobuf.sendKeepAliveCommand(pingReceived);
  }

  private clearStores() {
    // RoomPersistence.clearStore();
    // SessionPersistence.clearStore();
  }
}

//create the webclient instance and export it for the app to use
const webClient = new WebClient();

export default webClient;
