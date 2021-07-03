export class YAMLError extends Error {
    mark;
    constructor(message = "(unknown reason)", mark = "") {
        super(`${message} ${mark}`);
        this.mark = mark;
        this.name = this.constructor.name;
    }
    toString(_compact) {
        return `${this.name}: ${this.message} ${this.mark}`;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45OS4wL2VuY29kaW5nL195YW1sL2Vycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLE1BQU0sT0FBTyxTQUFVLFNBQVEsS0FBSztJQUd0QjtJQUZaLFlBQ0UsT0FBTyxHQUFHLGtCQUFrQixFQUNsQixPQUFzQixFQUFFO1FBRWxDLEtBQUssQ0FBQyxHQUFHLE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRmxCLFNBQUksR0FBSixJQUFJLENBQW9CO1FBR2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7SUFDcEMsQ0FBQztJQUVNLFFBQVEsQ0FBQyxRQUFpQjtRQUMvQixPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0RCxDQUFDO0NBQ0YifQ==