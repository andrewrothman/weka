import * as chokidar from "chokidar";
import * as callsite from "callsite";
import * as path from "path";
const warmRequire = require("warm-require");

export type WekaFuncResult = any;
export type WekaFuncMeta = { name: string } & { [key: string]: any };
export type WekaFuncHandler<Context> = (event: WekaEvent, ctx: Context) => WekaFuncResult | Promise<WekaFuncResult>;

export interface WekaEvent {
	trigger: string;
	function: string;
	args: { [key: string]: any };
}

export interface WekaFuncDef<Context> {
	meta: WekaFuncMeta;
	handler: WekaFuncHandler<Context>;
}

interface InternalWekaFunctionDef<Context> extends WekaFuncDef<Context> {
	path?: string;
	isWatching: boolean;
}

export interface WekaFuncDefES6<Context> {
	meta: WekaFuncMeta;
	default: WekaFuncHandler<Context>;
}

export type WekaTrigDef<Context> = any & {
	name: string;
	setup: (weka: Weka<Context>, options: { [key: string]: any }) => object | undefined;
};

export type WekaPreInvokeHandler<Context> = (event: WekaEvent, context: Context) => boolean | Promise<boolean>;

export default class Weka<Context> {
	private funcs: { [key: string]: InternalWekaFunctionDef<Context> } = {};
	private trigs: { [key: string]: WekaTrigDef<Context> } = {};
	private preInvokeHandlers: WekaPreInvokeHandler<Context>[] = [];
	
	private watcher: chokidar.FSWatcher | undefined = undefined;
	
	public registerFunction(funcDef: WekaFuncDef<Context> | WekaFuncDefES6<Context>) {
		if (typeof funcDef !== "object") {
			throw new Error("weka function registration parameter must be an object");
		}
		
		if (typeof funcDef.meta !== "object") {
			throw new Error("weka function registration parameter must include a \"meta\" object field");
		}
		
		if (typeof funcDef.meta.name !== "string") {
			throw new Error("weka function registration parameter must include a \"name\" string meta field");
		}
		
		if (typeof (funcDef as WekaFuncDef<Context>).handler !== "function" && typeof (funcDef as WekaFuncDefES6<Context>).default !== "function") {
			throw new Error("weka function registration parameter must include a default function export field or a \"handler\" field");
		}
		
		const name = funcDef.meta.name;
		
		this.funcs[name] = {
			meta: funcDef.meta,
			handler: (funcDef as WekaFuncDef<Context>).handler || (funcDef as WekaFuncDefES6<Context>).default,
			path: undefined,
			isWatching: false
		};
	}
	
	private setupWatcherHandler(watcher: chokidar.FSWatcher) {
		watcher.on("ready", () => {
			watcher.on("all", (eventType: string, changedPath: string) => {
				console.log(changedPath);
				delete require.cache[changedPath];
				const newFuncDef = require(changedPath);
				const newName = newFuncDef.meta.name;

				this.funcs[newName] = {
					meta: newFuncDef.meta,
					handler: (newFuncDef as WekaFuncDef<Context>).handler || (newFuncDef as WekaFuncDefES6<Context>).default,
					path: changedPath,
					isWatching: true
				};
			});
		});
	}
	
	public registerFuncFromPath(filePath: string, shouldWatch: boolean = true): void {
		// todo: ensure the path points to a single file
		
		const stack = callsite();
		const requester = stack[1].getFileName();
		
		const finalModulePath: string = path.resolve(path.dirname(requester), filePath);
		const finalFilePath: string = require.resolve(finalModulePath);
		
		const funcDef = require(finalModulePath);
		
		if (this.watcher === undefined) {
			this.watcher = chokidar.watch([finalFilePath]);
			this.setupWatcherHandler(this.watcher);
		}
		else {
			this.watcher.add(finalFilePath);
		}
		
		const name = funcDef.meta.name;

		this.funcs[name] = {
			meta: funcDef.meta,
			handler: (funcDef as WekaFuncDef<Context>).handler || (funcDef as WekaFuncDefES6<Context>).default,
			path: finalFilePath,
			isWatching: true
		};
	}
	
	public registerFuncsFromPath(dirPath: string, shouldWatch: boolean = true): void {
		// todo: ensure the path points to a directory
	}
	
	public registerTrigger(trigger: WekaTrigDef<Context>, options: { [key: string]: any } = {}) {
		if (typeof trigger.name !== "string") {
			throw new Error("weka trigger registration \"name\" field must be a string");
		}
		
		const returnValue = trigger.setup.apply(trigger, [this, options]);
		this.trigs[trigger.name] = trigger;
		
		return returnValue;
	}
	
	public async invoke(event: WekaEvent) {
		if (typeof event.trigger !== "string") {
			throw new Error("weka event invocation \"trigger\" field must be a string");
		}
		
		if (typeof event.function !== "string") {
			throw new Error("weka event invocation \"function\" field must be a string");
		}
		
		const context: Context = {} as Context;
		
		for (const handler of this.preInvokeHandlers) {
			const shouldContinue: boolean = await handler(event, context);
			if (shouldContinue === false) {
				// do not invoke
				return;
			}
		}
		
		const func = this.funcs[event.function];
		
		if (func === undefined) {
			throw new Error(`could not invoke event because no function named "${event.function}" was registered`);
		}
		
		return this.funcs[event.function].handler(event, context);
	}
	
	public addPreInvokeHandler(handler: WekaPreInvokeHandler<Context>) {
		this.preInvokeHandlers.push(handler);
	}
}
