import { ProtobufEvents } from '../services/ProtobufService';

import { serverIdentification } from './serverIdentification';

export const SessionEvents: ProtobufEvents = {
//   '.Event_AddToList.ext': addToList,
//   '.Event_ConnectionClosed.ext': connectionClosed,
//   '.Event_GameJoined.ext': gameJoined,
//   '.Event_ListRooms.ext': listRooms,
//   '.Event_NotifyUser.ext': notifyUser,
//   '.Event_RemoveFromList.ext': removeFromList,
//   '.Event_ReplayAdded.ext': () => console.log('Event_ReplayAdded'),
//   '.Event_ServerCompleteList.ext': () => console.log('Event_ServerCompleteList'),
  '.Event_ServerIdentification.ext': serverIdentification,
//   '.Event_ServerMessage.ext': serverMessage,
//   '.Event_ServerShutdown.ext': serverShutdown,
//   '.Event_UserJoined.ext': userJoined,
//   '.Event_UserLeft.ext': userLeft,
//   '.Event_UserMessage.ext': userMessage,
}
