import { Oid } from "./oid.ts";
import { Format } from "../connection/connection.ts";
import { decodeBigint, decodeBigintArray, decodeBoolean, decodeBooleanArray, decodeBox, decodeBoxArray, decodeBytea, decodeByteaArray, decodeCircle, decodeCircleArray, decodeDate, decodeDateArray, decodeDatetime, decodeDatetimeArray, decodeInt, decodeIntArray, decodeJson, decodeJsonArray, decodeLine, decodeLineArray, decodeLineSegment, decodeLineSegmentArray, decodePath, decodePathArray, decodePoint, decodePointArray, decodePolygon, decodePolygonArray, decodeStringArray, decodeTid, decodeTidArray, } from "./decoders.ts";
const decoder = new TextDecoder();
function decodeBinary() {
    throw new Error("Not implemented!");
}
function decodeText(value, typeOid) {
    const strValue = decoder.decode(value);
    switch (typeOid) {
        case Oid.bpchar:
        case Oid.char:
        case Oid.cidr:
        case Oid.float4:
        case Oid.float8:
        case Oid.inet:
        case Oid.macaddr:
        case Oid.name:
        case Oid.numeric:
        case Oid.oid:
        case Oid.regclass:
        case Oid.regconfig:
        case Oid.regdictionary:
        case Oid.regnamespace:
        case Oid.regoper:
        case Oid.regoperator:
        case Oid.regproc:
        case Oid.regprocedure:
        case Oid.regrole:
        case Oid.regtype:
        case Oid.text:
        case Oid.time:
        case Oid.timetz:
        case Oid.uuid:
        case Oid.varchar:
        case Oid.void:
            return strValue;
        case Oid.bpchar_array:
        case Oid.char_array:
        case Oid.cidr_array:
        case Oid.float4_array:
        case Oid.float8_array:
        case Oid.inet_array:
        case Oid.macaddr_array:
        case Oid.name_array:
        case Oid.numeric_array:
        case Oid.oid_array:
        case Oid.regclass_array:
        case Oid.regconfig_array:
        case Oid.regdictionary_array:
        case Oid.regnamespace_array:
        case Oid.regoper_array:
        case Oid.regoperator_array:
        case Oid.regproc_array:
        case Oid.regprocedure_array:
        case Oid.regrole_array:
        case Oid.regtype_array:
        case Oid.text_array:
        case Oid.time_array:
        case Oid.timetz_array:
        case Oid.uuid_varchar:
        case Oid.varchar_array:
            return decodeStringArray(strValue);
        case Oid.int2:
        case Oid.int4:
        case Oid.xid:
            return decodeInt(strValue);
        case Oid.int2_array:
        case Oid.int4_array:
        case Oid.xid_array:
            return decodeIntArray(strValue);
        case Oid.bool:
            return decodeBoolean(strValue);
        case Oid.bool_array:
            return decodeBooleanArray(strValue);
        case Oid.box:
            return decodeBox(strValue);
        case Oid.box_array:
            return decodeBoxArray(strValue);
        case Oid.circle:
            return decodeCircle(strValue);
        case Oid.circle_array:
            return decodeCircleArray(strValue);
        case Oid.bytea:
            return decodeBytea(strValue);
        case Oid.byte_array:
            return decodeByteaArray(strValue);
        case Oid.date:
            return decodeDate(strValue);
        case Oid.date_array:
            return decodeDateArray(strValue);
        case Oid.int8:
            return decodeBigint(strValue);
        case Oid.int8_array:
            return decodeBigintArray(strValue);
        case Oid.json:
        case Oid.jsonb:
            return decodeJson(strValue);
        case Oid.json_array:
        case Oid.jsonb_array:
            return decodeJsonArray(strValue);
        case Oid.line:
            return decodeLine(strValue);
        case Oid.line_array:
            return decodeLineArray(strValue);
        case Oid.lseg:
            return decodeLineSegment(strValue);
        case Oid.lseg_array:
            return decodeLineSegmentArray(strValue);
        case Oid.path:
            return decodePath(strValue);
        case Oid.path_array:
            return decodePathArray(strValue);
        case Oid.point:
            return decodePoint(strValue);
        case Oid.point_array:
            return decodePointArray(strValue);
        case Oid.polygon:
            return decodePolygon(strValue);
        case Oid.polygon_array:
            return decodePolygonArray(strValue);
        case Oid.tid:
            return decodeTid(strValue);
        case Oid.tid_array:
            return decodeTidArray(strValue);
        case Oid.timestamp:
        case Oid.timestamptz:
            return decodeDatetime(strValue);
        case Oid.timestamp_array:
        case Oid.timestamptz_array:
            return decodeDatetimeArray(strValue);
        default:
            return strValue;
    }
}
export function decode(value, column) {
    if (column.format === Format.BINARY) {
        return decodeBinary();
    }
    else if (column.format === Format.TEXT) {
        return decodeText(value, column.typeOid);
    }
    else {
        throw new Error(`Unknown column format: ${column.format}`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb2RlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9wb3N0Z3Jlc0B2MC4xMS4yL3F1ZXJ5L2RlY29kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQy9CLE9BQU8sRUFBVSxNQUFNLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUM3RCxPQUFPLEVBQ0wsWUFBWSxFQUNaLGlCQUFpQixFQUNqQixhQUFhLEVBQ2Isa0JBQWtCLEVBQ2xCLFNBQVMsRUFDVCxjQUFjLEVBQ2QsV0FBVyxFQUNYLGdCQUFnQixFQUNoQixZQUFZLEVBQ1osaUJBQWlCLEVBQ2pCLFVBQVUsRUFDVixlQUFlLEVBQ2YsY0FBYyxFQUNkLG1CQUFtQixFQUNuQixTQUFTLEVBQ1QsY0FBYyxFQUNkLFVBQVUsRUFDVixlQUFlLEVBQ2YsVUFBVSxFQUNWLGVBQWUsRUFDZixpQkFBaUIsRUFDakIsc0JBQXNCLEVBQ3RCLFVBQVUsRUFDVixlQUFlLEVBQ2YsV0FBVyxFQUNYLGdCQUFnQixFQUNoQixhQUFhLEVBQ2Isa0JBQWtCLEVBQ2xCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsY0FBYyxHQUNmLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE1BQU0sT0FBTyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFFbEMsU0FBUyxZQUFZO0lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUN0QyxDQUFDO0FBR0QsU0FBUyxVQUFVLENBQUMsS0FBaUIsRUFBRSxPQUFlO0lBQ3BELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFdkMsUUFBUSxPQUFPLEVBQUU7UUFDZixLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDaEIsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ2QsS0FBSyxHQUFHLENBQUMsSUFB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