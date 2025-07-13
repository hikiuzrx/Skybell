import { constants } from "../shared/constants"
export const socketConfig= {
    url : constants.SOCKET_IO_URL,
    transport: ['websocket', 'polling'],
    auth:{
        clientId: constants.ADMIN_ID, // Default admin ID,
    }

}