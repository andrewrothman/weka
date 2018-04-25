import Weka, { WekaTrigDef, WekaTriggerAttachInfo } from "@src";
import * as Koa from "koa";
import * as pathToRegexp from "path-to-regexp";

const TRIGGER_NAME: string = "http";
const DEFAULT_HTTP_PORT: number = 3000;

export interface WekaHttpOptions {
	port?: number;
	healthEndpointEnabled?: boolean;
}

export default class WekaHttp<Context> implements WekaTrigDef<Context> {
	private app: Koa;
	
	private healthEndpointEnabled: boolean = true;
	private port: number = DEFAULT_HTTP_PORT;
	
	constructor(weka: Weka<Context>, options?: WekaHttpOptions) {
		this.port = Number.parseInt(process.env.WEKA_HTTP_PORT || "") || (options || {}).port || this.port;
		
		if (typeof this.port !== "number") {
			throw new Error("weka-http \"port\" option must be a number");
		}
		
		if ((options || {}).healthEndpointEnabled === false) {
			this.healthEndpointEnabled = false;
		}
		
		this.app = new Koa();
	}
	
	public attach(weka: Weka<Context>): WekaTriggerAttachInfo {
		this.app.use(async (ctx: Koa.Context) => {
			// if the health endpoint is enabled, then return a 200 on the "/healthz" path
			// this is a docker and kubernetes standard that was put in practice by Google
			if (this.healthEndpointEnabled) {
				if (ctx.path === "/healthz") {
					ctx.status = 200;
					ctx.res.end("OK");
					return;
				}
			}

			for (const funcDef of weka.getAllFunctions()) {
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
						function: funcDef.meta.name,
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

		this.app.listen(this.port);
		console.log(`weka-http listening on port ${this.port}...`);
		
		return {
			triggerName: TRIGGER_NAME
		};
	}
}
