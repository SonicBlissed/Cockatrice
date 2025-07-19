import { SessionCommands } from '..';
import { StatusEnum, WebSocketConnectOptions, WebSocketConnectReason } from '../../../types';
import webClient from '../../WebClient';
import { hashPassword } from '../../utils/passwordHasher';
// import { SessionPersistence } from '../../persistence/SessionPersistence';

import { disconnect, updateStatus } from './';

export function login(options: WebSocketConnectOptions, passwordSalt?: string): void {
  const { userName, password, hashedPassword } = options;
 

  const loginConfig: any = {
    ...webClient.clientConfig,
    clientid: 'webatrice',
    userName,
  };

  if (passwordSalt) {
    loginConfig.hashedPassword = hashedPassword || hashPassword(passwordSalt, password!);
  } else {
    loginConfig.password = password;
  }

  const command = webClient.protobuf.controller.Command_Login.create(loginConfig);
  //the command to send to protobuf, which will then be sent to the server
  const sc = webClient.protobuf.controller.SessionCommand.create({ '.Command_Login.ext': command });
  console.log('Sending login command:', sc);

  webClient.protobuf.sendSessionCommand(sc, (raw: any) => {
    const resp = raw['.Response_Login.ext'];

    console.log('RESPONSE:', raw);

    if (raw.responseCode === webClient.protobuf.controller.Response.ResponseCode.RespOk) {
      const { buddyList, ignoreList, userInfo } = resp;

      // SessionPersistence.updateBuddyList(buddyList);
      // SessionPersistence.updateIgnoreList(ignoreList);
      // SessionPersistence.updateUser(userInfo);
      // SessionPersistence.loginSuccessful(loginConfig);

      // listUsers();
      // listRooms();

      console.log('Login successful:', userInfo);

      updateStatus(StatusEnum.LOGGED_IN, 'Logged in.');

      return;
    } else {
      console.error('Login failed:', raw.responseCode, resp);
    }

    switch (raw.responseCode) {
      case webClient.protobuf.controller.Response.ResponseCode.RespClientUpdateRequired:
        updateStatus(StatusEnum.DISCONNECTED, 'Login failed: missing features');
        break;

      case webClient.protobuf.controller.Response.ResponseCode.RespWrongPassword:
      case webClient.protobuf.controller.Response.ResponseCode.RespUsernameInvalid:
        updateStatus(StatusEnum.DISCONNECTED, 'Login failed: incorrect username or password');
        break;

      case webClient.protobuf.controller.Response.ResponseCode.RespWouldOverwriteOldSession:
        updateStatus(StatusEnum.DISCONNECTED, 'Login failed: duplicated user session');
        break;

      case webClient.protobuf.controller.Response.ResponseCode.RespUserIsBanned:
        updateStatus(StatusEnum.DISCONNECTED, 'Login failed: banned user');
        break;

      case webClient.protobuf.controller.Response.ResponseCode.RespRegistrationRequired:
        updateStatus(StatusEnum.DISCONNECTED, 'Login failed: registration required');
        break;

      case webClient.protobuf.controller.Response.ResponseCode.RespClientIdRequired:
        updateStatus(StatusEnum.DISCONNECTED, 'Login failed: missing client ID');
        break;

      case webClient.protobuf.controller.Response.ResponseCode.RespContextError:
        updateStatus(StatusEnum.DISCONNECTED, 'Login failed: server error');
        break;

      case webClient.protobuf.controller.Response.ResponseCode.RespAccountNotActivated:
        updateStatus(StatusEnum.DISCONNECTED, 'Login failed: account not activated');
        // SessionPersistence.accountAwaitingActivation(options);
        break;

      default:
        updateStatus(StatusEnum.DISCONNECTED, `Login failed: unknown error: ${raw.responseCode}`);
    }

    // SessionPersistence.loginFailed();
    disconnect();
  });
}
