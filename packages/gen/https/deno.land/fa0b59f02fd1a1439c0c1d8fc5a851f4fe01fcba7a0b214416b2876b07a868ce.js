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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sa0JBQWtCLE1BQU0sZ0NBQWdDLENBQUM7QUFXaEUsTUFBTSxVQUFVLFVBQVUsQ0FDeEIsTUFBb0IsRUFDcEIsSUFBZ0I7SUFFaEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO0lBQ2pDLE1BQU0sTUFBTSxHQUFnQjtRQUMxQixJQUFJO1FBQ0osT0FBTyxFQUFFLEVBQUU7S0FDWixDQUFDO0lBQ0YsSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLGtCQUFrQixDQUFDLGtCQUFrQixFQUFFO1FBQzdELE1BQU0sQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN2QztJQUNELE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixFQUFFLENBQUM7SUFDbkQsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyJ9