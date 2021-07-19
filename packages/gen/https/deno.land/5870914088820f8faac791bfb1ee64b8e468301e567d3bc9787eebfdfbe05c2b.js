import { getStr } from "./wasm.ts";
import { Status } from "./constants.ts";
export default class SqliteError extends Error {
    constructor(context, code) {
        if (typeof context === "string") {
            super(context);
            this.code = code ?? Status.Unknown;
        }
        else {
            super(getStr(context, context.get_sqlite_error_str()));
            this.code = code ?? context.get_status();
        }
        this.name = "SqliteError";
    }
    code;
    get codeName() {
        return Status[this.code];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L3NxbGl0ZUB2Mi40LjAvc3JjL2Vycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDbkMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRXhDLE1BQU0sQ0FBQyxPQUFPLE9BQU8sV0FBWSxTQUFRLEtBQUs7SUFZNUMsWUFBWSxPQUFzQixFQUFFLElBQWE7UUFDL0MsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7WUFDL0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2YsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQztTQUNwQzthQUFNO1lBQ0wsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztTQUMxQztRQUNELElBQUksQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDO0lBQzVCLENBQUM7SUEwQ0QsSUFBSSxDQUFTO0lBV2IsSUFBSSxRQUFRO1FBQ1YsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBd0IsQ0FBQztJQUNsRCxDQUFDO0NBQ0YifQ==