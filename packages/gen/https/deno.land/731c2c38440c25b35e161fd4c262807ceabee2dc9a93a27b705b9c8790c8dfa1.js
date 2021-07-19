import { rsa_oaep_encrypt, rsa_pkcs1_encrypt, rsa_oaep_decrypt, rsa_pkcs1_decrypt } from "./src/rsa.ts";
import { ber_decode, ber_simple } from "./src/basic_encoding_rule.ts";
import { base64_to_binary, get_key_size, str2bytes } from "./src/helper.ts";
export class RSA {
    static encrypt(message, key, options) {
        if (!key.e)
            throw "Invalid RSA key";
        const computedOptions = { hash: "sha1", padding: "oaep", ...options };
        const computedMessage = typeof message === "string" ? str2bytes(message) : message;
        if (computedOptions.padding === "oaep") {
            return rsa_oaep_encrypt(key.length, key.n, key.e, computedMessage, computedOptions.hash);
        }
        else if (computedOptions.padding === "pkcs1") {
            return rsa_pkcs1_encrypt(key.length, key.n, key.e, computedMessage);
        }
        throw "Invalid parameters";
    }
    static decrypt(ciper, key, options) {
        if (!key.d)
            throw "Invalid RSA key";
        const computedOptions = { hash: "sha1", padding: "oaep", ...options };
        if (computedOptions.padding === "oaep") {
            return rsa_oaep_decrypt(key.length, key.n, key.d, ciper, computedOptions.hash);
        }
        else if (computedOptions.padding === "pkcs1") {
            return rsa_pkcs1_decrypt(key.length, key.n, key.d, ciper);
        }
        throw "Invalid parameters";
    }
    static parseKey(key) {
        if (key.indexOf("-----BEGIN RSA PRIVATE KEY-----") === 0) {
            const trimmedKey = key.substr(31, key.length - 61);
            const parseKey = ber_simple(ber_decode(base64_to_binary(trimmedKey)));
            return {
                n: parseKey[1],
                d: parseKey[3],
                e: parseKey[2],
                length: get_key_size(parseKey[1])
            };
        }
        else if (key.indexOf("-----BEGIN PUBLIC KEY-----") === 0) {
            const trimmedKey = key.substr(26, key.length - 51);
            const parseKey = ber_simple(ber_decode(base64_to_binary(trimmedKey)));
            return {
                length: get_key_size(parseKey[1][0][0]),
                n: parseKey[1][0][0],
                e: parseKey[1][0][1],
            };
        }
        throw "Invalid key format";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnNhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicnNhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN4RyxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ3RFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFnQjVFLE1BQU0sT0FBTyxHQUFHO0lBQ2QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUE0QixFQUFFLEdBQVcsRUFBRSxPQUE0QjtRQUNwRixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFBRSxNQUFNLGlCQUFpQixDQUFDO1FBRXBDLE1BQU0sZUFBZSxHQUFjLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEdBQUcsT0FBTyxFQUFFLENBQUM7UUFDakYsTUFBTSxlQUFlLEdBQUcsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUVuRixJQUFJLGVBQWUsQ0FBQyxPQUFPLEtBQUssTUFBTSxFQUFFO1lBQ3RDLE9BQU8sZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxRjthQUFNLElBQUksZUFBZSxDQUFDLE9BQU8sS0FBSyxPQUFPLEVBQUU7WUFDOUMsT0FBTyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FB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