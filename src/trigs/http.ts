import Weka from "@src";
import * as Koa from "koa";
import * as pathToRegexp from "path-to-regexp";

const TRIGGER_NAME: string = "http";
const DEFAULT_HTTP_PORT: number = 3000;

export default {
	name: TRIGGER_NAME,
	app: undefined as any as Koa,
	setup(weka: Weka, options: { [key: string]: any }): object {
		const port = options.port || DEFAULT_HTTP_PORT;
		
		if (typeof port !== "number") {
			throw new Error("weka-http \"port\" option must be a number");
		}
		
		this.app = new Koa();
		
		this.app.use(async (ctx: Koa.Context) => {
			for (const [funcName, funcDef] of Object.entries(weka.funcs)) {
				if (typeof funcDef.meta.http !== "object") {
					continue;
				}
				
				const funcHttpMethod: string = (funcDef.meta.http.method || "").toLowerCase();
				const funcHttpUrl: string = (funcDef.meta.http.url || "");
				
				const reqUrlKeys: pathToRegexp.Key[] = [];
				const reqUrlRegex = pathToRegexp(funcHttpUrl, reqUrlKeys);
				
				const reqHttpUrl = ctx.request.url;
				
				if (reqHttpUrl.match(reqUrlRegex)) {
					const reqUrlValues = reqUrlRegex.exec(reqHttpUrl)!;
					
					const args: { [key: string]: any } = {};
					
					for (let i = 0; i < reqUrlKeys.length; i++) {
						const reqUrlKey = reqUrlKeys[i];
						
						args[reqUrlKey.name] = reqUrlValues[i + 1];
					}
					
					const funcRes = await weka.invoke({
						trigger: TRIGGER_NAME,
						function: funcName,
						args
					});
					
					if (typeof funcRes === "string") {
						ctx.body = funcRes;
					}
					else if (typeof funcRes === "object") {
						ctx.status = funcRes.statusCode || 200;
						
						let headers: { [key: string]: string } = {};
						let bodyStr: string = "{}";
						
						if (typeof funcRes.body === "object") {
							bodyStr = JSON.stringify(funcRes.body);
							headers["Content-Type"] = "application/json";
						}
						else {
							// todo: might not be string serializable
						}
						
						headers = { ...headers, ...(funcRes.headers || {}) };
						ctx.body = funcRes.body || "{}";
						
						for (const [headerName, headerValue] of Object.entries(headers)) {
							ctx.set(headerName, headerValue);
						}
						
						return;
					}
					else {
						throw new Error(`weka http function return should be either a string or object, but received type "${typeof funcRes}"`);
					}
				}
			}
		});
		
		this.app.listen(port);
		console.log(`weka-http listening on port ${port}...`);
		
		return this.app;
	}
};
