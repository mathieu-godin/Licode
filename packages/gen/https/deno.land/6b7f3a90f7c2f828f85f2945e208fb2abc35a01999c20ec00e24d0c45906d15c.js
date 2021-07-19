import { RSA } from "https://deno.land/x/god_crypto@v0.2.0/mod.ts";
function encryptWithPublicKey(key, data) {
    const publicKey = RSA.parseKey(key);
    return RSA.encrypt(data, publicKey);
}
export { encryptWithPublicKey };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J5cHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcnlwdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sOENBQThDLENBQUM7QUFDbkUsU0FBUyxvQkFBb0IsQ0FBQyxHQUFXLEVBQUUsSUFBZ0I7SUFDekQsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNwQyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3RDLENBQUM7QUFFRCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyJ9