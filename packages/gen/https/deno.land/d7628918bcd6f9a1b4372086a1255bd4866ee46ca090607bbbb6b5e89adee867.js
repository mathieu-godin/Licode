import { VERSION } from "../info.ts";
const json = {
    filename: "scripts.json",
    source: String.raw `{
  "$schema": "https://deno.land/x/denon@${VERSION}/schema.json",
  "scripts": {
    "start": {
      "cmd": "deno run app.ts",
      "desc": "run my app.ts file"
    }
  }
}`,
};
const yaml = {
    filename: "scripts.yml",
    source: String.raw `scripts:
  start:
    cmd: "deno run app.ts"
    desc: "run my app.ts file"`,
};
const typescript = {
    filename: "scripts.config.ts",
    source: String.raw `
import { DenonConfig } from "https://deno.land/x/denon@${VERSION}/mod.ts";

const config: DenonConfig = {
  scripts: {
    start: {
      cmd: "deno run app.ts",
      desc: "run my app.ts file",
    },
  },
};

export default config;`,
};
export const templates = {
    json: json,
    yaml: yaml,
    yml: yaml,
    ts: typescript,
    typescript: typescript,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9kZW5vbkAyLjQuOC9zcmMvdGVtcGxhdGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFTckMsTUFBTSxJQUFJLEdBQWE7SUFDckIsUUFBUSxFQUFFLGNBQWM7SUFDeEIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUE7MENBQ3NCLE9BQU87Ozs7Ozs7RUFPL0M7Q0FDRCxDQUFDO0FBRUYsTUFBTSxJQUFJLEdBQWE7SUFDckIsUUFBUSxFQUFFLGFBQWE7SUFDdkIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUE7OzsrQkFHVztDQUM5QixDQUFDO0FBRUYsTUFBTSxVQUFVLEdBQWE7SUFDM0IsUUFBUSxFQUFFLG1CQUFtQjtJQUM3QixNQUFNLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQTt5REFDcUMsT0FBTzs7Ozs7Ozs7Ozs7dUJBV3pDO0NBQ3RCLENBQUM7QUFFRixNQUFNLENBQUMsTUFBTSxTQUFTLEdBQWdDO0lBQ3BELElBQUksRUFBRSxJQUFJO0lBQ1YsSUFBSSxFQUFFLElBQUk7SUFDVixHQUFHLEVBQUUsSUFBSTtJQUNULEVBQUUsRUFBRSxVQUFVO0lBQ2QsVUFBVSxFQUFFLFVBQVU7Q0FDdkIsQ0FBQyJ9