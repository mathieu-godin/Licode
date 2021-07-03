const { PermissionDenied } = Deno.errors;
function getPermissionString(descriptors) {
    return descriptors.length
        ? `  ${descriptors
            .map((pd) => {
            switch (pd.name) {
                case "read":
                case "write":
                    return pd.path
                        ? `--allow-${pd.name}=${pd.path}`
                        : `--allow-${pd.name}`;
                case "net":
                    return pd.host
                        ? `--allow-${pd.name}=${pd.host}`
                        : `--allow-${pd.name}`;
                default:
                    return `--allow-${pd.name}`;
            }
        })
            .join("\n  ")}`
        : "";
}
export async function grant(descriptor, ...descriptors) {
    const result = [];
    descriptors = Array.isArray(descriptor)
        ? descriptor
        : [descriptor, ...descriptors];
    for (const descriptor of descriptors) {
        let state = (await Deno.permissions.query(descriptor)).state;
        if (state === "prompt") {
            state = (await Deno.permissions.request(descriptor)).state;
        }
        if (state === "granted") {
            result.push(descriptor);
        }
    }
    return result.length ? result : undefined;
}
export async function grantOrThrow(descriptor, ...descriptors) {
    const denied = [];
    descriptors = Array.isArray(descriptor)
        ? descriptor
        : [descriptor, ...descriptors];
    for (const descriptor of descriptors) {
        const { state } = await Deno.permissions.request(descriptor);
        if (state !== "granted") {
            denied.push(descriptor);
        }
    }
    if (denied.length) {
        throw new PermissionDenied(`The following permissions have not been granted:\n${getPermissionString(denied)}`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQvc3RkQDAuOTkuMC9wZXJtaXNzaW9ucy9tb2QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsTUFBTSxFQUFFLGdCQUFnQixFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUV6QyxTQUFTLG1CQUFtQixDQUFDLFdBQXdDO0lBQ25FLE9BQU8sV0FBVyxDQUFDLE1BQU07UUFDdkIsQ0FBQyxDQUFDLEtBQ0EsV0FBVzthQUNSLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ1YsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFO2dCQUNmLEtBQUssTUFBTSxDQUFDO2dCQUNaLEtBQUssT0FBTztvQkFDVixPQUFPLEVBQUUsQ0FBQyxJQUFJO3dCQUNaLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLElBQUksRUFBRTt3QkFDakMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMzQixLQUFLLEtBQUs7b0JBQ1IsT0FBTyxFQUFFLENBQUMsSUFBSTt3QkFDWixDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUU7d0JBQ2pDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDM0I7b0JBQ0UsT0FBTyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUMvQjtRQUNILENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxNQUFNLENBQ2hCLEVBQUU7UUFDRixDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ1QsQ0FBQztBQWdDRCxNQUFNLENBQUMsS0FBSyxVQUFVLEtBQUssQ0FDekIsVUFBbUUsRUFDbkUsR0FBRyxXQUF3QztJQUUzQyxNQUFNLE1BQU0sR0FBZ0MsRUFBRSxDQUFDO0lBQy9DLFdBQVcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUNyQyxDQUFDLENBQUMsVUFBVTtRQUNaLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxHQUFHLFdBQVcsQ0FBQyxDQUFDO0lBQ2pDLEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFO1FBQ3BDLElBQUksS0FBSyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUM3RCxJQUFJLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDdEIsS0FBSyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztTQUM1RDtRQUNELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUN2QixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3pCO0tBQ0Y7SUFDRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQzVDLENBQUM7QUF3QkQsTUFBTSxDQUFDLEtBQUssVUFBVSxZQUFZLENBQ2hDLFVBQW1FLEVBQ25FLEdBQUcsV0FBd0M7SUFFM0MsTUFBTSxNQUFNLEdBQWdDLEVBQUUsQ0FBQztJQUMvQyxXQUFXLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFDckMsQ0FBQyxDQUFDLFVBQVU7UUFDWixDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsR0FBRyxXQUFXLENBQUMsQ0FBQztJQUNqQyxLQUFLLE1BQU0sVUFBVSxJQUFJLFdBQVcsRUFBRTtRQUNwQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3RCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN6QjtLQUNGO0lBQ0QsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO1FBQ2pCLE1BQU0sSUFBSSxnQkFBZ0IsQ0FDeEIscURBQ0UsbUJBQW1CLENBQ2pCLE1BQU0sQ0FFVixFQUFFLENBQ0gsQ0FBQztLQUNIO0FBQ0gsQ0FBQyJ9