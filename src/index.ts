import * as callsite from "callsite";
import * as path from "path";
import { Watcher } from "@src/watcher";
import FunctionStore, { WekaFuncMeta, WekaFuncHandler, WekaFuncDef, WekaFuncDefES6, InternalWekaFunctionDef } from "@src/func_store";

export interface WekaEvent {
	trigger: string;
	function: string;
	args: { [key: string]: any };
}

export type WekaTrigDef<Context> = any & {
	name: string;
	setup: (weka: Weka<Context>, options: { [key: string]: any }) => object | undefined;
};

export type WekaPreInvokeHandler<Context> = (event: WekaEvent, context: Context) => boolean | Promise<boolean>;

export interface WekaOptions {
	watchedPaths?: string[];
}

export default class Weka<Context> {
	private trigs: { [key: string]: WekaTrigDef<Context> } = {};
	private preInvokeHandlers: WekaPreInvokeHandler<Context>[] = [];
	
	private funcStore: FunctionStore<Context> = new FunctionStore();
	private watcher: Watcher = new Watcher({ onWatchedPathChanged: this.onWatchedPathChanged.bind(this) });
	
	constructor(options: WekaOptions) {
		if (options.watchedPaths !== undefined) {
			this.watcher.startWatchingPaths(options.watchedPaths);
		}
	}
	
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
		
		const internalFucDef: InternalWekaFunctionDef<Context> = {
			meta: funcDef.meta,
			handler: FunctionStore.getFunctionHandlerFromDef(funcDef),
			path: undefined,
			isWatching: false
		};
		
		this.funcStore.addFunction(internalFucDef);
	}
	
	public registerFuncFromPath(filePath: string, shouldWatch: boolean = true): void {
		// todo: ensure the path points to a single file

		const stack = callsite();
		const requester = stack[1].getFileName();

		const finalModulePath: string = path.resolve(path.dirname(requester), filePath);
		const finalFilePath: string = require.resolve(finalModulePath);

		const funcDef = require(finalModulePath);
		
		this.watcher.startWatchingPaths([finalFilePath]);

		const internalFuncDef: InternalWekaFunctionDef<Context> = {
			meta: funcDef.meta,
			handler: FunctionStore.getFunctionHandlerFromDef(funcDef),
			path: finalFilePath,
			isWatching: true
		};
		
		this.funcStore.addFunction(internalFuncDef);
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
		
		const func = this.funcStore.getFunction(event.function);
		
		const context: Context = {} as Context;
		if (await this.runPreInvokeHandlers(event, context) === false) {
			return;
		}
		
		return func.handler(event, context);
	}
	
	public async runPreInvokeHandlers(event: WekaEvent, context: Context): Promise<boolean> {
		for (const handler of this.preInvokeHandlers) {
			const shouldContinue: boolean = await handler(event, context);
			if (shouldContinue === false) {
				
				// do not invoke
				return false;
			}
		}
		
		return true;
	}
	
	public addPreInvokeHandler(handler: WekaPreInvokeHandler<Context>) {
		this.preInvokeHandlers.push(handler);
	}
	
	private onWatchedPathChanged(eventType: string, changedPath: string) {
		const func: InternalWekaFunctionDef<Context> | undefined = this.funcStore.findByPath(changedPath);
		
		if (func !== undefined) {
			console.log("bursting", func.path!);
			
			this.funcStore.burstFunction(func);
		}
		else {
			console.log("bursting", changedPath);
			
			// burst the cache for this file
			delete require.cache[require.resolve(changedPath)];
			
			console.log("bursting all functions");
			
			// if the file was not found, invalidate the cache for all functions (in case the file was a dependency of one of the functions)
			this.funcStore.burstAllFunctions();
		}
	}
	
	// todo: change this to getFunctions(callback(meta: WekaFuncMeta) => true | false): InternalWekaFuncDef
	// and use in koa
	// or, even, invoke by name and invokeWhere by meta, but this would be a larger architectural change
	public getAllFunctions(): InternalWekaFunctionDef<Context>[] {
		return this.funcStore.getAll();
	}
}
