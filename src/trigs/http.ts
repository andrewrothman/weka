import Weka, { WekaTrigDef, WekaTriggerAttachInfo } from "@src";
import * as Koa from "koa";
import * as pathToRegexp from "path-to-regexp";
import * as bodyParser from "koa-bodyparser";
import { Z_ASCII } from "zlib";

const TRIGGER_NAME: string = "http";
const DEFAULT_HTTP_PORT: number = 3000;

export interface WekaHttpOptions {
	port?: number;
	healthEndpointEnabled?: boolean;
	
	bodyParser?: {
		formLimit?: string;
		jsonLimit?: string;
		strict?: boolean;
	}
}

export default class WekaHttp<Context> implements WekaTrigDef<Context> {
	private app: Koa;
	
	private healthEndpointEnabled: boolean = true;
	private port: number = DEFAULT_HTTP_PORT;
	private enabledTypes: string[] = ["json", "form"];
	private bodyParserFormLimit: string = "56kb";
	private bodyParserJsonLimit: string = "1mb";
	private bodyParserStrict: boolean = true;
	
	constructor(weka: Weka<Context>, options?: WekaHttpOptions) {
		this.port = Number.parseInt(process.env.WEKA_HTTP_PORT || "") || (options || {}).port || this.port;
		
		if (typeof this.port !== "number") {
			throw new Error("weka-http \"port\" option must be a number");
		}
		
		if (options !== undefined) {
			if (options.healthEndpointEnabled === false) {
				this.healthEndpointEnabled = false;
			}
			
			if (options.bodyParser !== undefined) {
				if (options.bodyParser.formLimit !== undefined) {
					this.bodyParserFormLimit = options.bodyParser.formLimit;
				}
				
				if (options.bodyParser.jsonLimit !== undefined) {
					this.bodyParserFormLimit = options.bodyParser.jsonLimit;
				}
				
				if (options.bodyParser.strict !== undefined) {
					this.bodyParserStrict = options.bodyParser.strict;
				}
			}
		}
		
		this.app = new Koa();
	}
	
	public attach(weka: Weka<Context>): WekaTriggerAttachInfo {
		this.app.use(bodyParser({
			jsonLimit: this.bodyParserJsonLimit,
			formLimit: this.bodyParserFormLimit,
			strict: this.bodyParserStrict
		}));
		
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
				const funcHttpPath: string = (funcDef.meta.http.path || "");

				const reqPathKeys: pathToRegexp.Key[] = [];
				const reqPathRegex = pathToRegexp(funcHttpPath, reqPathKeys);

				const reqHttpPath = ctx.request.url;

				if (reqHttpPath.match(reqPathRegex)) {
					const reqPathValues = reqPathRegex.exec(reqHttpPath)!;

					let args: { [key: string]: any } = {};
					
					// pull in path params

					for (let i = 0; i < reqPathKeys.length; i++) {
						const reqPathKey: pathToRegexp.Key = reqPathKeys[i];
						args[reqPathKey.name] = reqPathValues[i + 1];
					}
					
					// merge in query params
					
					args = { ...args, ...ctx.query };
					
					// merge in body parser params (if correct content-type specified)
					
					if (ctx.get("content-type") === "application/json" || ctx.get("content-type") === "application/x-www-form-urlencoded") {
						args = { ...args, ...ctx.request.body };
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
