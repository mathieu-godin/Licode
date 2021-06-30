export const jsonResponse = (req, status, jsonObj) => {
    const retJson = JSON.stringify(jsonObj);
    var headers = new Headers();
    headers.append("content-type", "application/json; charset=UTF-8");
    return req.respond({
        status: status,
        headers: headers,
        body: retJson
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tSZXNwb25zZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJxdWlja1Jlc3BvbnNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxNQUFNLENBQUMsTUFBTSxZQUFZLEdBQ3JCLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRTtJQUNyQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLElBQUksT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7SUFDNUIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztJQUNsRSxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUM7UUFDZixNQUFNLEVBQUUsTUFBTTtRQUNkLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLElBQUksRUFBRSxPQUFPO0tBQ2hCLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyJ9