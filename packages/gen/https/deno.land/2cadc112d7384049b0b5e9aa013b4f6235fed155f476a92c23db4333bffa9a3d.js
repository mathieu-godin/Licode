import { assert, HmacSha256 } from "./deps.ts";
function compareArrayBuffer(a, b) {
    assert(a.byteLength === b.byteLength, "ArrayBuffer lengths must match.");
    const va = new DataView(a);
    const vb = new DataView(b);
    const length = va.byteLength;
    let out = 0;
    let i = -1;
    while (++i < length) {
        out |= va.getUint8(i) ^ vb.getUint8(i);
    }
    return out === 0;
}
export function compare(a, b) {
    const key = new Uint8Array(32);
    globalThis.crypto.getRandomValues(key);
    const ah = (new HmacSha256(key)).update(a).arrayBuffer();
    const bh = (new HmacSha256(key)).update(b).arrayBuffer();
    return compareArrayBuffer(ah, bh);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHNzQ29tcGFyZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRzc0NvbXBhcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBTUEsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFFL0MsU0FBUyxrQkFBa0IsQ0FBQyxDQUFjLEVBQUUsQ0FBYztJQUN4RCxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUMsVUFBVSxFQUFFLGlDQUFpQyxDQUFDLENBQUM7SUFDekUsTUFBTSxFQUFFLEdBQUcsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsTUFBTSxFQUFFLEdBQUcsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztJQUM3QixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDWixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNYLE9BQU8sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFO1FBQ25CLEdBQUcsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDeEM7SUFDRCxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUM7QUFDbkIsQ0FBQztBQU9ELE1BQU0sVUFBVSxPQUFPLENBQ3JCLENBQStDLEVBQy9DLENBQStDO0lBRS9DLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLFVBQVUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3ZDLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDekQsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUN6RCxPQUFPLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNwQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgb2FrIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG4vLyBUaGlzIHdhcyBpbnNwaXJlZCBieSBodHRwczovL2dpdGh1Yi5jb20vc3VyeWFnaC90c3NjbXAgd2hpY2ggcHJvdmlkZXMgYVxuLy8gdGltaW5nIHNhZmUgc3RyaW5nIGNvbXBhcmlzb24gdG8gYXZvaWQgdGltaW5nIGF0dGFja3MgYXMgZGVzY3JpYmVkIGluXG4vLyBodHRwczovL2NvZGFoYWxlLmNvbS9hLWxlc3Nvbi1pbi10aW1pbmctYXR0YWNrcy8uXG5cbmltcG9ydCB7IGFzc2VydCwgSG1hY1NoYTI1NiB9IGZyb20gXCIuL2RlcHMudHNcIjtcblxuZnVuY3Rpb24gY29tcGFyZUFycmF5QnVmZmVyKGE6IEFycmF5QnVmZmVyLCBiOiBBcnJheUJ1ZmZlcik6IGJvb2xlYW4ge1xuICBhc3NlcnQoYS5ieXRlTGVuZ3RoID09PSBiLmJ5dGVMZW5ndGgsIFwiQXJyYXlCdWZmZXIgbGVuZ3RocyBtdXN0IG1hdGNoLlwiKTtcbiAgY29uc3QgdmEgPSBuZXcgRGF0YVZpZXcoYSk7XG4gIGNvbnN0IHZiID0gbmV3IERhdGFWaWV3KGIpO1xuICBjb25zdCBsZW5ndGggPSB2YS5ieXRlTGVuZ3RoO1xuICBsZXQgb3V0ID0gMDtcbiAgbGV0IGkgPSAtMTtcbiAgd2hpbGUgKCsraSA8IGxlbmd0aCkge1xuICAgIG91dCB8PSB2YS5nZXRVaW50OChpKSBeIHZiLmdldFVpbnQ4KGkpO1xuICB9XG4gIHJldHVybiBvdXQgPT09IDA7XG59XG5cbi8qKiBDb21wYXJlIHR3byBzdHJpbmdzLCBVaW50OEFycmF5cywgQXJyYXlCdWZmZXJzLCBvciBhcnJheXMgb2YgbnVtYmVycyBpbiBhXG4gKiB3YXkgdGhhdCBhdm9pZHMgdGltaW5nIGJhc2VkIGF0dGFja3Mgb24gdGhlIGNvbXBhcmlzb25zIG9uIHRoZSB2YWx1ZXMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIGB0cnVlYCBpZiB0aGUgdmFsdWVzIG1hdGNoLCBvciBgZmFsc2VgLCBpZiB0aGV5XG4gKiBkbyBub3QgbWF0Y2guICovXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZShcbiAgYTogc3RyaW5nIHwgbnVtYmVyW10gfCBBcnJheUJ1ZmZlciB8IFVpbnQ4QXJyYXksXG4gIGI6IHN0cmluZyB8IG51bWJlcltdIHwgQXJyYXlCdWZmZXIgfCBVaW50OEFycmF5LFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGtleSA9IG5ldyBVaW50OEFycmF5KDMyKTtcbiAgZ2xvYmFsVGhpcy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGtleSk7XG4gIGNvbnN0IGFoID0gKG5ldyBIbWFjU2hhMjU2KGtleSkpLnVwZGF0ZShhKS5hcnJheUJ1ZmZlcigpO1xuICBjb25zdCBiaCA9IChuZXcgSG1hY1NoYTI1NihrZXkpKS51cGRhdGUoYikuYXJyYXlCdWZmZXIoKTtcbiAgcmV0dXJuIGNvbXBhcmVBcnJheUJ1ZmZlcihhaCwgYmgpO1xufVxuIl19