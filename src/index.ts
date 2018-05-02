import * as callsite from "callsite";
import * as path from "path";
import * as fs from "fs";
import { Watcher } from "./watcher";
import FunctionStore, { WekaFuncMeta, WekaFuncHandler, WekaFuncDef, WekaFuncDefES6, InternalWekaFunctionDef } from "./func_store";
import TriggerStore, { WekaTriggerDef, WekaTriggerAttachInfo } from "./trig_store";
import { EMSGSIZE } from "constants";

export interface WekaEvent {
	trigger: string;
	function: string;
	args: { [key: string]: any };
}

export type WekaPreInvokeHandler<Context> = (event: WekaEvent, context: Context) => boolean | Promise<boolean>;

export interface WekaOptions {
	watchedPaths?: string[];
	hotReloadEnabled?: boolean;
}

export default class Weka<Context> {
	private funcStore: FunctionStore<Context> = new FunctionStore();
	private trigStore: TriggerStore<Context> = new TriggerStore();
	
	private preInvokeHandlers: WekaPreInvokeHandler<Context>[] = [];
	
	private watcher: Watcher = new Watcher({ onWatchedPathChanged: this.onWatchedPathChanged.bind(this) });
	
	private hotReloadEnabled: boolean = process.env.NODE_ENV === undefined || process.env.NODE_ENV === "" || process.env.NODE_ENV === "development";
	
	constructor(options?: WekaOptions) {
		if (options !== undefined) {
			if (options.hotReloadEnabled !== undefined) {
				this.hotReloadEnabled = options.hotReloadEnabled;
			}
			
			if (options.watchedPaths !== undefined && this.hotReloadEnabled) {
				this.watcher.startWatchingPaths(options.watchedPaths);
			}
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
		const requester: string = stack[1].getFileName();

		const finalModulePath: string = path.resolve(path.dirname(requester), filePath);
		const finalFilePath: string = require.resolve(finalModulePath);
		
		const stat = fs.statSync(finalFilePath);

		if (!stat.isFile) {
			throw new Error("weka could not register file path because path wasn't a file: " + finalModulePath);
		}

		const funcDef = require(finalModulePath);
		
		if (this.hotReloadEnabled && shouldWatch) {
			this.watcher.startWatchingPaths([finalFilePath]);
		}

		const internalFuncDef: InternalWekaFunctionDef<Context> = {
			meta: funcDef.meta,
			handler: FunctionStore.getFunctionHandlerFromDef(funcDef),
			path: finalFilePath,
			isWatching: true
		};
		
		this.funcStore.addFunction(internalFuncDef);
	}

	public registerFuncsFromDirectoryPath(dirPath: string, shouldWatch: boolean = true): void {
		// todo: ensure the path points to a directory
		
		const stack = callsite();
		const requester: string = stack[1].getFileName();
		
		const finalDirPath: string = path.join(requester, "../", dirPath);
		
		const stat = fs.statSync(finalDirPath);
		
		if (!stat.isDirectory) {
			throw new Error("weka could not register directory path because path wasn't a directory: " + finalDirPath);
		}
		
		const files = fs.readdirSync(finalDirPath);
		
		for (const fileName of files) {
			this.registerFuncFromPath(path.join(finalDirPath, fileName), false);
		}
		
		if (shouldWatch && this.hotReloadEnabled) {
			this.watcher.startWatchingPaths([finalDirPath + "/**"]);
		}
	}
	
	public unregisterFunction(funcName: string) {
		this.funcStore.removeFunction(funcName);
	}
	
	public registerTrigger(trigger: WekaTriggerDef<Context>) {
		// todo: validate that "attach" exists

		const attachInfo: WekaTriggerAttachInfo = trigger.attach(this);
		this.trigStore.registerTrigger(trigger, attachInfo);
	}
	
	public unregisterTrigger(triggerName: string) {
		this.trigStore.unregisterTrigger(triggerName);
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
