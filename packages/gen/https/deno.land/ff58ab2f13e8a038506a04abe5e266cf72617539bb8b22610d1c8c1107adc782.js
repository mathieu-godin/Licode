import { BufferWriter } from "../../buffer.ts";
import ServerCapabilities from "../../constant/capabilities.ts";
import { PacketType } from "../../constant/packet.ts";
export function parseHandshake(reader) {
    const protocolVersion = reader.readUint8();
    const serverVersion = reader.readNullTerminatedString();
    const threadId = reader.readUint32();
    const seedWriter = new BufferWriter(new Uint8Array(20));
    seedWriter.writeBuffer(reader.readBuffer(8));
    reader.skip(1);
    let serverCapabilities = reader.readUint16();
    let characterSet = 0, statusFlags = 0, authPluginDataLength = 0, authPluginName = "";
    if (!reader.finished) {
        characterSet = reader.readUint8();
        statusFlags = reader.readUint16();
        serverCapabilities |= reader.readUint16() << 16;
        if ((serverCapabilities & ServerCapabilities.CLIENT_PLUGIN_AUTH) != 0) {
            authPluginDataLength = reader.readUint8();
        }
        else {
            reader.skip(1);
        }
        reader.skip(10);
        if ((serverCapabilities & ServerCapabilities.CLIENT_SECURE_CONNECTION) !=
            0) {
            seedWriter.writeBuffer(reader.readBuffer(Math.max(13, authPluginDataLength - 8)));
        }
        if ((serverCapabilities & ServerCapabilities.CLIENT_PLUGIN_AUTH) != 0) {
            authPluginName = reader.readNullTerminatedString();
        }
    }
    return {
        protocolVersion,
        serverVersion,
        threadId,
        seed: seedWriter.buffer,
        serverCapabilities,
        characterSet,
        statusFlags,
        authPluginName,
    };
}
export var AuthResult;
(function (AuthResult) {
    AuthResult[AuthResult["AuthPassed"] = 0] = "AuthPassed";
    AuthResult[AuthResult["MethodMismatch"] = 1] = "MethodMismatch";
    AuthResult[AuthResult["AuthMoreRequired"] = 2] = "AuthMoreRequired";
})(AuthResult || (AuthResult = {}));
export function parseAuth(packet) {
    switch (packet.type) {
        case PacketType.EOF_Packet:
            return AuthResult.MethodMismatch;
        case PacketType.Result:
            return AuthResult.AuthMoreRequired;
        case PacketType.OK_Packet:
            return AuthResult.AuthPassed;
        default:
            return AuthResult.AuthPassed;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZHNoYWtlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaGFuZHNoYWtlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBZ0IsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDN0QsT0FBTyxrQkFBa0IsTUFBTSxnQ0FBZ0MsQ0FBQztBQUNoRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFnQnRELE1BQU0sVUFBVSxjQUFjLENBQUMsTUFBb0I7SUFDakQsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQzNDLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0lBQ3hELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUNyQyxNQUFNLFVBQVUsR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3hELFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDZixJQUFJLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUU3QyxJQUFJLFlBQVksR0FBVyxDQUFDLEVBQzFCLFdBQVcsR0FBVyxDQUFDLEVBQ3ZCLG9CQUFvQixHQUFXLENBQUMsRUFDaEMsY0FBYyxHQUFXLEVBQUUsQ0FBQztJQUU5QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtRQUNwQixZQUFZLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2xDLFdBQVcsR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEMsa0JBQWtCLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUVoRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDckUsb0JBQW9CLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQzNDO2FBQU07WUFDTCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2hCO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVoQixJQUNFLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUMsd0JBQXdCLENBQUM7WUFDaEUsQ0FBQyxFQUNIO1lBQ0EsVUFBVSxDQUFDLFdBQVcsQ0FDcEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUMxRCxDQUFDO1NBQ0g7UUFFRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDckUsY0FBYyxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1NBQ3BEO0tBQ0Y7SUFFRCxPQUFPO1FBQ0wsZUFBZTtRQUNmLGFBQWE7UUFDYixRQUFRO1FBQ1IsSUFBSSxFQUFFLFVBQVUsQ0FBQyxNQUFNO1FBQ3ZCLGtCQUFrQjtRQUNsQixZQUFZO1FBQ1osV0FBVztRQUNYLGNBQWM7S0FDZixDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sQ0FBTixJQUFZLFVBSVg7QUFKRCxXQUFZLFVBQVU7SUFDcEIsdURBQVUsQ0FBQTtJQUNWLCtEQUFjLENBQUE7SUFDZCxtRUFBZ0IsQ0FBQTtBQUNsQixDQUFDLEVBSlcsVUFBVSxLQUFWLFVBQVUsUUFJckI7QUFDRCxNQUFNLFVBQVUsU0FBUyxDQUFDLE1BQXFCO0lBQzdDLFFBQVEsTUFBTSxDQUFDLElBQUksRUFBRTtRQUNuQixLQUFLLFVBQVUsQ0FBQyxVQUFVO1lBQ3hCLE9BQU8sVUFBVSxDQUFDLGNBQWMsQ0FBQztRQUNuQyxLQUFLLFVBQVUsQ0FBQyxNQUFNO1lBQ3BCLE9BQU8sVUFBVSxDQUFDLGdCQUFnQixDQUFDO1FBQ3JDLEtBQUssVUFBVSxDQUFDLFNBQVM7WUFDdkIsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDO1FBQy9CO1lBQ0UsT0FBTyxVQUFVLENBQUMsVUFBVSxDQUFDO0tBQ2hDO0FBQ0gsQ0FBQyJ9