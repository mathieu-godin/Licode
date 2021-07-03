import { Type } from "../type.ts";
function reconstructFunction(code) {
    const func = new Function(`return ${code}`)();
    if (!(func instanceof Function)) {
        throw new TypeError(`Expected function but got ${typeof func}: ${code}`);
    }
    return func;
}
export const func = new Type("tag:yaml.org,2002:js/function", {
    kind: "scalar",
    resolve(data) {
        if (data === null) {
            return false;
        }
        try {
            reconstructFunction(`${data}`);
            return true;
        }
        catch (_err) {
            return false;
        }
    },
    construct(data) {
        return reconstructFunction(data);
    },
    predicate(object) {
        return object instanceof Function;
    },
    represent(object) {
        return object.toString();
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC45OS4wL2VuY29kaW5nL195YW1sL3R5cGUvZnVuY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0EsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFlBQVksQ0FBQztBQUtsQyxTQUFTLG1CQUFtQixDQUFDLElBQVk7SUFDdkMsTUFBTSxJQUFJLEdBQUcsSUFBSSxRQUFRLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7SUFDOUMsSUFBSSxDQUFDLENBQUMsSUFBSSxZQUFZLFFBQVEsQ0FBQyxFQUFFO1FBQy9CLE1BQU0sSUFBSSxTQUFTLENBQUMsNkJBQTZCLE9BQU8sSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDLENBQUM7S0FDMUU7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsK0JBQStCLEVBQUU7SUFDNUQsSUFBSSxFQUFFLFFBQVE7SUFDZCxPQUFPLENBQUMsSUFBUztRQUNmLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtZQUNqQixPQUFPLEtBQUssQ0FBQztTQUNkO1FBQ0QsSUFBSTtZQUNGLG1CQUFtQixDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMvQixPQUFPLElBQUksQ0FBQztTQUNiO1FBQUMsT0FBTyxJQUFJLEVBQUU7WUFDYixPQUFPLEtBQUssQ0FBQztTQUNkO0lBQ0gsQ0FBQztJQUNELFNBQVMsQ0FBQyxJQUFZO1FBQ3BCLE9BQU8sbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUNELFNBQVMsQ0FBQyxNQUFlO1FBQ3ZCLE9BQU8sTUFBTSxZQUFZLFFBQVEsQ0FBQztJQUNwQyxDQUFDO0lBQ0QsU0FBUyxDQUFDLE1BQStCO1FBQ3ZDLE9BQU8sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzNCLENBQUM7Q0FDRixDQUFDLENBQUMifQ==