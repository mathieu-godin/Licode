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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZHNoYWtlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9teXNxbEB2Mi45LjAvc3JjL3BhY2tldHMvcGFyc2Vycy9oYW5kc2hha2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFnQixZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUM3RCxPQUFPLGtCQUFrQixNQUFNLGdDQUFnQyxDQUFDO0FBQ2hFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQWdCdEQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxNQUFvQjtJQUNqRCxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDM0MsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUM7SUFDeEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ3JDLE1BQU0sVUFBVSxHQUFHLElBQUksWUFBWSxDQUFDLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEQsVUFBVSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNmLElBQUksa0JBQWtCLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBRTdDLElBQUksWUFBWSxHQUFXLENBQUMsRUFDMUIsV0FBVyxHQUFXLENBQUMsRUFDdkIsb0JBQW9CLEdBQVcsQ0FBQyxFQUNoQyxjQUFjLEdBQVcsRUFBRSxDQUFDO0lBRTlCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO1FBQ3BCLFlBQVksR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDbEMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNsQyxrQkFBa0IsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDO1FBRWhELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyRSxvQkFBb0IsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7U0FDM0M7YUFBTTtZQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDaEI7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRWhCLElBQ0UsQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyx3QkFBd0IsQ0FBQztZQUNoRSxDQUFDLEVBQ0g7WUFDQSxVQUFVLENBQUMsV0FBVyxDQUNwQixNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLG9CQUFvQixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQzFELENBQUM7U0FDSDtRQUVELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyRSxjQUFjLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUM7U0FDcEQ7S0FDRjtJQUVELE9BQU87UUFDTCxlQUFlO1FBQ2YsYUFBYTtRQUNiLFFBQVE7UUFDUixJQUFJLEVBQUUsVUFBVSxDQUFDLE1BQU07UUFDdkIsa0JBQWtCO1FBQ2xCLFlBQVk7UUFDWixXQUFXO1FBQ1gsY0FBYztLQUNmLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxDQUFOLElBQVksVUFJWDtBQUpELFdBQVksVUFBVTtJQUNwQix1REFBVSxDQUFBO0lBQ1YsK0RBQWMsQ0FBQTtJQUNkLG1FQUFnQixDQUFBO0FBQ2xCLENBQUMsRUFKVyxVQUFVLEtBQVYsVUFBVSxRQUlyQjtBQUNELE1BQU0sVUFBVSxTQUFTLENBQUMsTUFBcUI7SUFDN0MsUUFBUSxNQUFNLENBQUMsSUFBSSxFQUFFO1FBQ25CLEtBQUssVUFBVSxDQUFDLFVBQVU7WUFDeEIsT0FBTyxVQUFVLENBQUMsY0FBYyxDQUFDO1FBQ25DLEtBQUssVUFBVSxDQUFDLE1BQU07WUFDcEIsT0FBTyxVQUFVLENBQUMsZ0JBQWdCLENBQUM7UUFDckMsS0FBSyxVQUFVLENBQUMsU0FBUztZQUN2QixPQUFPLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDL0I7WUFDRSxPQUFPLFVBQVUsQ0FBQyxVQUFVLENBQUM7S0FDaEM7QUFDSCxDQUFDIn0=