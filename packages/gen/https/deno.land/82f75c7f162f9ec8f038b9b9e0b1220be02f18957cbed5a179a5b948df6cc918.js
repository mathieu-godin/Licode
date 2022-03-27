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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9kZW5vbkAyLjUuMC9zcmMvdGVtcGxhdGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFTckMsTUFBTSxJQUFJLEdBQWE7SUFDckIsUUFBUSxFQUFFLGNBQWM7SUFDeEIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUE7MENBQ3NCLE9BQU87Ozs7Ozs7RUFPL0M7Q0FDRCxDQUFDO0FBRUYsTUFBTSxJQUFJLEdBQWE7SUFDckIsUUFBUSxFQUFFLGFBQWE7SUFDdkIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUE7OzsrQkFHVztDQUM5QixDQUFDO0FBRUYsTUFBTSxVQUFVLEdBQWE7SUFDM0IsUUFBUSxFQUFFLG1CQUFtQjtJQUM3QixNQUFNLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQTt5REFDcUMsT0FBTzs7Ozs7Ozs7Ozs7dUJBV3pDO0NBQ3RCLENBQUM7QUFFRixNQUFNLENBQUMsTUFBTSxTQUFTLEdBQWdDO0lBQ3BELElBQUksRUFBRSxJQUFJO0lBQ1YsSUFBSSxFQUFFLElBQUk7SUFDVixHQUFHLEVBQUUsSUFBSTtJQUNULEVBQUUsRUFBRSxVQUFVO0lBQ2QsVUFBVSxFQUFFLFVBQVU7Q0FDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDIwLTIwMjEgdGhlIGRlbm9zYXVycyB0ZWFtLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgVkVSU0lPTiB9IGZyb20gXCIuLi9pbmZvLnRzXCI7XG5cbi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlbXBsYXRlIHtcbiAgZmlsZW5hbWU6IHN0cmluZztcbiAgc291cmNlOiBzdHJpbmc7XG59XG5cbmNvbnN0IGpzb246IFRlbXBsYXRlID0ge1xuICBmaWxlbmFtZTogXCJzY3JpcHRzLmpzb25cIixcbiAgc291cmNlOiBTdHJpbmcucmF3YHtcbiAgXCIkc2NoZW1hXCI6IFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9kZW5vbkAke1ZFUlNJT059L3NjaGVtYS5qc29uXCIsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJzdGFydFwiOiB7XG4gICAgICBcImNtZFwiOiBcImRlbm8gcnVuIGFwcC50c1wiLFxuICAgICAgXCJkZXNjXCI6IFwicnVuIG15IGFwcC50cyBmaWxlXCJcbiAgICB9XG4gIH1cbn1gLFxufTtcblxuY29uc3QgeWFtbDogVGVtcGxhdGUgPSB7XG4gIGZpbGVuYW1lOiBcInNjcmlwdHMueW1sXCIsXG4gIHNvdXJjZTogU3RyaW5nLnJhd2BzY3JpcHRzOlxuICBzdGFydDpcbiAgICBjbWQ6IFwiZGVubyBydW4gYXBwLnRzXCJcbiAgICBkZXNjOiBcInJ1biBteSBhcHAudHMgZmlsZVwiYCxcbn07XG5cbmNvbnN0IHR5cGVzY3JpcHQ6IFRlbXBsYXRlID0ge1xuICBmaWxlbmFtZTogXCJzY3JpcHRzLmNvbmZpZy50c1wiLFxuICBzb3VyY2U6IFN0cmluZy5yYXdgXG5pbXBvcnQgeyBEZW5vbkNvbmZpZyB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L2Rlbm9uQCR7VkVSU0lPTn0vbW9kLnRzXCI7XG5cbmNvbnN0IGNvbmZpZzogRGVub25Db25maWcgPSB7XG4gIHNjcmlwdHM6IHtcbiAgICBzdGFydDoge1xuICAgICAgY21kOiBcImRlbm8gcnVuIGFwcC50c1wiLFxuICAgICAgZGVzYzogXCJydW4gbXkgYXBwLnRzIGZpbGVcIixcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY29uZmlnO2AsXG59O1xuXG5leHBvcnQgY29uc3QgdGVtcGxhdGVzOiB7IFtrZXk6IHN0cmluZ106IFRlbXBsYXRlIH0gPSB7XG4gIGpzb246IGpzb24sXG4gIHlhbWw6IHlhbWwsXG4gIHltbDogeWFtbCxcbiAgdHM6IHR5cGVzY3JpcHQsXG4gIHR5cGVzY3JpcHQ6IHR5cGVzY3JpcHQsXG59O1xuIl19