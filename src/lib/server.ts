import {ServerRequest} from 'https://deno.land/std@0.97.0/http/server.ts';
import {Status} from 'https://deno.land/std@0.97.0/http/http_status.ts';

export const enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
  }
  
  export type Route = {
    method: HttpMethod;
    route: string;
    handler: (req: ServerRequest, ...params: any) => void;
  };
  
  export type RouteParam = {
    idx: number;
    paramKey: string;
  };
  
  /**
   * Extract all the route params out of the route into an array of RouteParam.
   * Example: /api/user/:id => [{ idx: 2, paramKey: 'id' }]
   * @param route the configured route with params
   */
  export const extractRouteParams: (route: string) => RouteParam[] = (route) =>
    route.split('/').reduce((accum: RouteParam[], curr: string, idx: number) => {
      if (/:[A-Za-z1-9]{1,}/.test(curr)) {
        const paramKey: string = curr.replace(':', '');
        const param: RouteParam = { idx, paramKey };
        return [...accum, param];
      }
      return accum;
    }, []);
  
  export const routeParamPattern: (route: string) => string = (route) =>
    route.replace(/\/\:[^/]{1,}/gi, '/[^/]{1,}').replace(/\//g, '\\/');
  
  /**
   * Basic route matcher. Check to see if the method and url match the route
   * @param req the received request
   * @param route the route being checked against
   */
   export const basicRouteMatcher = (req: ServerRequest, route: Route): boolean =>
   req.method === route.method && req.url === route.route;
  
   export const routeWithParamsRouteMatcher = (req: ServerRequest, route: Route): boolean => {
    const routeMatcherRegEx = new RegExp(`^${routeParamPattern(route.route)}$`);
    return req.method === route.method && route.route.includes('/:') && routeMatcherRegEx.test(req.url);
  };
  
  /**
   * Match the received request to a route in the routing table. return the handler function for that route
   * @param routes the routing table for the API
   * @param req the received request
   */
   export const matchRequestToRouteHandler = async (routes: Route[], req: ServerRequest): Promise<void> => {
    let route: Route | undefined = routes.find((route: Route) => basicRouteMatcher(req, route));
    if (route) {
      await route.handler(req);
      // const response: any = await route.handler();
      // return req.respond({ status: Status.OK, body: JSON.stringify(response) });
    }
    route = routes.find((route: Route) => routeWithParamsRouteMatcher(req, route));
    if (route) {
      // the received route has route params, extract the route params from the route
      const routeParamsMap: RouteParam[] = extractRouteParams(route.route);
      const routeSegments: string[] = req.url.split('/');
      const routeParams: { [key: string]: string | number } = routeParamsMap.reduce(
        (accum: { [key: string]: string | number }, curr: RouteParam) => {
          return {
            ...accum,
            [curr.paramKey]: routeSegments[curr.idx],
          };
        },
        {}
      );
      await route.handler(req, ...Object.values(routeParams));
      // const response: any = await route.handler(...Object.values(routeParams));
      // return req.respond({ status: Status.OK, body: JSON.stringify(response) });
    }
    // route could not be found, return 404
    return req.respond({ status: Status.NotFound, body: 'Route not found' });
  };