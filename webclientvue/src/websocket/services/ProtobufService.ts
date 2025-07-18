import protobuf from 'protobufjs';

// import { CommonEvents, GameEvents, RoomEvents, SessionEvents } from '../events';
// import { SessionPersistence } from '../persistence/SessionPersistence';
import { WebClient } from '../WebClient';
import { SessionCommands } from '../../websocket/commands/index';
import ProtoFiles from '../../proto-files.json';
import { SessionEvents } from '../events';

export interface ProtobufEvents {
  [event: string]: Function;
}

export class ProtobufService {
  //this was originally a env called PUBLIC_URL/pb
  static PB_FILE_DIR = `/pb`;

  public controller: any;
  private cmdId = 0;
  private pendingCommands: { [cmdId: string]: Function } = {};

  private webClient: WebClient;

  constructor(webClient: WebClient) {
    this.webClient = webClient;

    this.loadProtobufFiles();
  }

  public resetCommands() {
    this.cmdId = 0;
    this.pendingCommands = {};
  }

  public sendKeepAliveCommand(pingReceived: Function) {
    console.log('SESSION PING GOES HERE');
    // SessionCommands.ping(pingReceived);
  }

  public handleMessageEvent({ data }: MessageEvent): void {
    try {
      const uint8msg = new Uint8Array(data);
      const msg = this.controller.ServerMessage.decode(uint8msg);

      if (msg) {
        switch (msg.messageType) {
          case this.controller.ServerMessage.MessageType.RESPONSE:
            this.processServerResponse(msg.response);
            break;
          // case this.controller.ServerMessage.MessageType.ROOM_EVENT:
          //   this.processRoomEvent(msg.roomEvent, msg);
          //   break;
          case this.controller.ServerMessage.MessageType.SESSION_EVENT:
            this.processSessionEvent(msg.sessionEvent, msg);
            break;
          // case this.controller.ServerMessage.MessageType.GAME_EVENT_CONTAINER:
          //   this.processGameEvent(msg.gameEvent, msg);
          //   break;
          default:
            console.log(msg);
            break;
        }
      }
    } catch (err) {
      console.error('Processing failed:', err);
    }
  }

  private processServerResponse(response: any) {
    const { cmdId } = response;

    if (this.pendingCommands[cmdId]) {
      this.pendingCommands[cmdId](response);
      delete this.pendingCommands[cmdId];
    }
  }

  private processEvent(response: any, events: ProtobufEvents, raw: any) {
    for (const event in events) {
      const payload = response[event];

      if (!events[event]) {
        return;
      }

      if (payload) {
        events[event](payload, raw);
        return;
      }
    }
  }

  // private processCommonEvent(response: any, raw: any) {
  //   this.processEvent(response, CommonEvents, raw);
  // }

  // private processRoomEvent(response: any, raw: any) {
  //   this.processEvent(response, RoomEvents, raw);
  // }

  private processSessionEvent(response: any, raw: any) {
    this.processEvent(response, SessionEvents, raw);
  }

  // private processGameEvent(response: any, raw: any): void {
  //   this.processEvent(response, GameEvents, raw);
  // }

  // private processEvent(response: any, events: ProtobufEvents, raw: any) {
  //   for (const event in events) {
  //     if(!events[event]){
  //       return;
  //     }
  //     const payload = response[event];

  //     if (payload) {
  //       events[event](payload, raw);
  //       return;
  //     }
  //   }
  // }

  private loadProtobufFiles() {
    const files = ProtoFiles.map((file) => `${ProtobufService.PB_FILE_DIR}/${file}`);

    this.controller = new protobuf.Root();
    this.controller.load(files, { keepCase: false }, (err: any) => {
      if (err) {
        throw err;
      }

      // SessionPersistence.initialized();
    });
  }

  public sendCommand(cmd: any, callback: Function) {
    this.cmdId++;

    cmd['cmdId'] = this.cmdId;
    this.pendingCommands[this.cmdId] = callback;

    if (this.webClient.socket.checkReadyState(WebSocket.OPEN)) {
      this.webClient.socket.send(this.controller.CommandContainer.encode(cmd).finish());
    }
  }

  public sendSessionCommand(sesCmd: number, callback?: Function) {
    const cmd = this.controller.CommandContainer.create({
      sessionCommand: [sesCmd],
    });

    this.sendCommand(cmd, (raw: any) => callback && callback(raw));
  }
}
