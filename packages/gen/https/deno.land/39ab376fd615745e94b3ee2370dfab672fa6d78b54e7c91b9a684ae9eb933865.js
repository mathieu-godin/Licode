import { StringType } from "./string.ts";
export class ActionListType extends StringType {
    cmd;
    constructor(cmd) {
        super();
        this.cmd = cmd;
    }
    complete() {
        return this.cmd.getCompletions()
            .map((type) => type.name)
            .filter((value, index, self) => self.indexOf(value) === index);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uX2xpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L2NsaWZmeUB2MC4xOS4yL2NvbW1hbmQvdHlwZXMvYWN0aW9uX2xpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUd6QyxNQUFNLE9BQU8sY0FBZSxTQUFRLFVBQVU7SUFDdEI7SUFBdEIsWUFBc0IsR0FBWTtRQUNoQyxLQUFLLEVBQUUsQ0FBQztRQURZLFFBQUcsR0FBSCxHQUFHLENBQVM7SUFFbEMsQ0FBQztJQUdNLFFBQVE7UUFDYixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFO2FBQzdCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUV4QixNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQztJQUNuRSxDQUFDO0NBQ0YifQ==