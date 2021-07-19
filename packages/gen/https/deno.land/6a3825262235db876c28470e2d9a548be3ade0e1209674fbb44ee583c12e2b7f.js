export function replaceParams(sql, params) {
    if (!params)
        return sql;
    let paramIndex = 0;
    sql = sql.replace(/('.*')|(".*")|(\?\?)|(\?)/g, (str) => {
        if (paramIndex >= params.length)
            return str;
        if (/".*"/g.test(str) || /'.*'/g.test(str)) {
            return str;
        }
        if (str === "??") {
            const val = params[paramIndex++];
            if (val instanceof Array) {
                return `(${val.map((item) => replaceParams("??", [item])).join(",")})`;
            }
            else if (val === "*") {
                return val;
            }
            else if (typeof val === "string" && val.includes(".")) {
                const _arr = val.split(".");
                return replaceParams(_arr.map(() => "??").join("."), _arr);
            }
            else if (typeof val === "string" &&
                (val.includes(" as ") || val.includes(" AS "))) {
                const newVal = val.replace(" as ", " AS ");
                const _arr = newVal.split(" AS ");
                return replaceParams(_arr.map(() => "??").join(" AS "), _arr);
            }
            else {
                return ["`", val, "`"].join("");
            }
        }
        const val = params[paramIndex++];
        if (val === null)
            return "NULL";
        switch (typeof val) {
            case "object":
                if (val instanceof Date)
                    return `"${formatDate(val)}"`;
                if (val instanceof Array) {
                    return `(${val.map((item) => replaceParams("?", [item])).join(",")})`;
                }
            case "string":
                return `"${escapeString(val)}"`;
            case "undefined":
                return "NULL";
            case "number":
            case "boolean":
            default:
                return val;
        }
    });
    return sql;
}
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const days = date
        .getDate()
        .toString()
        .padStart(2, "0");
    const hours = date
        .getHours()
        .toString()
        .padStart(2, "0");
    const minutes = date
        .getMinutes()
        .toString()
        .padStart(2, "0");
    const seconds = date
        .getSeconds()
        .toString()
        .padStart(2, "0");
    const milliseconds = date
        .getMilliseconds()
        .toString()
        .padStart(3, "0");
    return `${year}-${month}-${days} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}
function escapeString(str) {
    return str.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxVQUFVLGFBQWEsQ0FBQyxHQUFXLEVBQUUsTUFBbUI7SUFDNUQsSUFBSSxDQUFDLE1BQU07UUFBRSxPQUFPLEdBQUcsQ0FBQztJQUN4QixJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDbkIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUN0RCxJQUFJLFVBQVUsSUFBSSxNQUFNLENBQUMsTUFBTTtZQUFFLE9BQU8sR0FBRyxDQUFDO1FBRTVDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzFDLE9BQU8sR0FBRyxDQUFDO1NBQ1o7UUFFRCxJQUFJLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDaEIsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDakMsSUFBSSxHQUFHLFlBQVksS0FBSyxFQUFFO2dCQUN4QixPQUFPLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQzthQUN4RTtpQkFBTSxJQUFJLEdBQUcsS0FBSyxHQUFHLEVBQUU7Z0JBQ3RCLE9BQU8sR0FBRyxDQUFDO2FBQ1o7aUJBQU0sSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFFdkQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDNUIsT0FBTyxhQUFhLENB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