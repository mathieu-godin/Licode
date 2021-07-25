import { ClientPostgreSQL, } from "https://deno.land/x/nessie/mod.ts";
const client = new ClientPostgreSQL({
    database: "licode",
    hostname: "localhost",
    port: 5432,
    user: "licode",
    password: "edocil",
});
const config = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};
export default config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmVzc2llLmNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5lc3NpZS5jb25maWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNILGdCQUFnQixHQUVuQixNQUFNLG1DQUFtQyxDQUFDO0FBRTNDLE1BQU0sTUFBTSxHQUFHLElBQUksZ0JBQWdCLENBQUM7SUFDaEMsUUFBUSxFQUFFLFFBQVE7SUFDbEIsUUFBUSxFQUFFLFdBQVc7SUFDckIsSUFBSSxFQUFFLElBQUk7SUFDVixJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRSxRQUFRO0NBQ3JCLENBQUMsQ0FBQztBQUdILE1BQU0sTUFBTSxHQUFpQjtJQUN6QixNQUFNO0lBQ04sZ0JBQWdCLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztJQUNyQyxXQUFXLEVBQUUsQ0FBQyxZQUFZLENBQUM7Q0FDOUIsQ0FBQztBQUVGLGVBQWUsTUFBTSxDQUFDIn0=