import auth from "../../auth.ts";
import { BufferWriter } from "../../buffer.ts";
import ServerCapabilities from "../../constant/capabilities.ts";
import { Charset } from "../../constant/charset.ts";
export function buildAuth(packet, params) {
    const clientParam = (params.db ? ServerCapabilities.CLIENT_CONNECT_WITH_DB : 0) |
        ServerCapabilities.CLIENT_PLUGIN_AUTH |
        ServerCapabilities.CLIENT_LONG_PASSWORD |
        ServerCapabilities.CLIENT_PROTOCOL_41 |
        ServerCapabilities.CLIENT_TRANSACTIONS |
        ServerCapabilities.CLIENT_MULTI_RESULTS |
        ServerCapabilities.CLIENT_SECURE_CONNECTION |
        (ServerCapabilities.CLIENT_LONG_FLAG & packet.serverCapabilities) |
        (ServerCapabilities.CLIENT_PLUGIN_AUTH_LENENC_CLIENT_DATA &
            packet.serverCapabilities) |
        (ServerCapabilities.CLIENT_DEPRECATE_EOF & packet.serverCapabilities);
    if (packet.serverCapabilities & ServerCapabilities.CLIENT_PLUGIN_AUTH) {
        const writer = new BufferWriter(new Uint8Array(1000));
        writer
            .writeUint32(clientParam)
            .writeUint32(2 ** 24 - 1)
            .write(Charset.UTF8_GENERAL_CI)
            .skip(23)
            .writeNullTerminatedString(params.username);
        if (params.password) {
            const authData = auth(packet.authPluginName, params.password, packet.seed);
            if (clientParam &
                ServerCapabilities.CLIENT_PLUGIN_AUTH_LENENC_CLIENT_DATA ||
                clientParam & ServerCapabilities.CLIENT_SECURE_CONNECTION) {
                writer.write(authData.length);
                writer.writeBuffer(authData);
            }
            else {
                writer.writeBuffer(authData);
                writer.write(0);
            }
        }
        else {
            writer.write(0);
        }
        if (clientParam & ServerCapabilities.CLIENT_CONNECT_WITH_DB && params.db) {
            writer.writeNullTerminatedString(params.db);
        }
        if (clientParam & ServerCapabilities.CLIENT_PLUGIN_AUTH) {
            writer.writeNullTerminatedString(packet.authPluginName);
        }
        return writer.wroteData;
    }
    return Uint8Array.from([]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF1dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sZUFBZSxDQUFDO0FBQ2pDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLGtCQUFrQixNQUFNLGdDQUFnQyxDQUFDO0FBQ2hFLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUlwRCxNQUFNLFVBQVUsU0FBUyxDQUN2QixNQUFxQixFQUNyQixNQUE0RDtJQUU1RCxNQUFNLFdBQVcsR0FDZixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0Qsa0JBQWtCLENBQUMsa0JBQWtCO1FBQ3JDLGtCQUFrQixDQUFDLG9CQUFvQjtRQUN2QyxrQkFBa0IsQ0FBQyxrQkFBa0I7UUFDckMsa0JBQWtCLENBQUMsbUJBQW1CO1FBQ3RDLGtCQUFrQixDQUFDLG9CQUFvQjtRQUN2QyxrQkFBa0IsQ0FBQyx3QkFBd0I7UUFDM0MsQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsa0JBQWtCLENBQUM7UUFDakUsQ0FBQyxrQkFBa0IsQ0FBQyxxQ0FBcUM7WUFDdkQsTUFBTSxDQUFDLGtCQUFrQixDQUFDO1FBQzVCLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFFeEUsSUFBSSxNQUFNLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUMsa0JBQWtCLEVBQUU7UUFDckUsTUFBTSxNQUFNLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN0RCxNQUFNO2FBQ0gsV0FBVyxDQUFDLFdBQVcsQ0FBQzthQUN4QixXQUFXLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDeEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUM7YUFDOUIsSUFBSSxDQUFDLEVBQUUsQ0FBQzthQUNSLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDbkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUNuQixNQUFNLENBQUMsY0FBYyxFQUNyQixNQUFNLENBQUMsUUFBUSxFQUNmLE1BQU0sQ0FBQyxJQUFJLENBQ1osQ0FBQztZQUNGLElBQ0UsV0FBVztnQkFDVCxrQkFBa0IsQ0FBQyxxQ0FBcUM7Z0JBQzFELFdBQVcsR0FBRyxrQkFBa0IsQ0FBQyx3QkFBd0IsRUFDekQ7Z0JBRUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDOUI7aUJBQU07Z0JBQ0wsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDN0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNqQjtTQUNGO2FBQU07WUFDTCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pCO1FBQ0QsSUFBSSxXQUFXLEdBQUcsa0JBQWtCLENBQUMsc0JBQXNCLElBQUksTUFBTSxDQUFDLEVBQUUsRUFBRTtZQUN4RSxNQUFNLENBQUMseUJBQXlCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQzdDO1FBQ0QsSUFBSSxXQUFXLEdBQUcsa0JBQWtCLENBQUMsa0JBQWtCLEVBQUU7WUFDdkQsTUFBTSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUN6RDtRQUNELE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQztLQUN6QjtJQUNELE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM3QixDQUFDIn0=