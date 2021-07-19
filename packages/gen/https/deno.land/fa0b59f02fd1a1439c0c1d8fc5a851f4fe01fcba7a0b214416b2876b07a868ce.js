import ServerCapabilities from "../../constant/capabilities.ts";
export function parseError(reader, conn) {
    const code = reader.readUint16();
    const packet = {
        code,
        message: "",
    };
    if (conn.capabilities & ServerCapabilities.CLIENT_PROTOCOL_41) {
        packet.sqlStateMarker = reader.readUint8();
        packet.sqlState = reader.readUints(5);
    }
    packet.message = reader.readNullTerminatedString();
    return packet;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9teXNxbEB2Mi45LjAvc3JjL3BhY2tldHMvcGFyc2Vycy9lcnIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxrQkFBa0IsTUFBTSxnQ0FBZ0MsQ0FBQztBQVdoRSxNQUFNLFVBQVUsVUFBVSxDQUN4QixNQUFvQixFQUNwQixJQUFnQjtJQUVoQixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDakMsTUFBTSxNQUFNLEdBQWdCO1FBQzFCLElBQUk7UUFDSixPQUFPLEVBQUUsRUFBRTtLQUNaLENBQUM7SUFDRixJQUFJLElBQUksQ0FBQyxZQUFZLEdBQUcsa0JBQWtCLENBQUMsa0JBQWtCLEVBQUU7UUFDN0QsTUFBTSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDM0MsTUFBTSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3ZDO0lBQ0QsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztJQUNuRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDIn0=