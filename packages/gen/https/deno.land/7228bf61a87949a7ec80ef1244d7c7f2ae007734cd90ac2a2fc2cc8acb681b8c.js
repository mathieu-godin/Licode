import { Hash } from "./_wasm/hash.ts";
export const supportedAlgorithms = [
    "md2",
    "md4",
    "md5",
    "ripemd160",
    "ripemd320",
    "sha1",
    "sha224",
    "sha256",
    "sha384",
    "sha512",
    "sha3-224",
    "sha3-256",
    "sha3-384",
    "sha3-512",
    "keccak224",
    "keccak256",
    "keccak384",
    "keccak512",
];
export function createHash(algorithm) {
    return new Hash(algorithm);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuOTMuMC9oYXNoL21vZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFJdkMsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUc7SUFDakMsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsV0FBVztJQUNYLFdBQVc7SUFDWCxNQUFNO0lBQ04sUUFBUTtJQUNSLFFBQVE7SUFDUixRQUFRO0lBQ1IsUUFBUTtJQUNSLFVBQVU7SUFDVixVQUFVO0lBQ1YsVUFBVTtJQUNWLFVBQVU7SUFDVixXQUFXO0lBQ1gsV0FBVztJQUNYLFdBQVc7SUFDWCxXQUFXO0NBQ0gsQ0FBQztBQU9YLE1BQU0sVUFBVSxVQUFVLENBQUMsU0FBNkI7SUFDdEQsT0FBTyxJQUFJLElBQUksQ0FBQyxTQUFtQixDQUFDLENBQUM7QUFDdkMsQ0FBQyJ9