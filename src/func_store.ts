import { WekaEvent } from "./";

export type WekaFuncResult = any;
export type WekaFuncMeta = { name: string } & { [key: string]: any };
export type WekaFuncHandler<Context> = (event: WekaEvent, ctx: Context) => WekaFuncResult | Promise<WekaFuncResult>;

export interface WekaFuncDef<Context> {
	meta: WekaFuncMeta;
	handler: WekaFuncHandler<Context>;
}

export interface InternalWekaFunctionDef<Context> extends WekaFuncDef<Context> {
	path?: string;
	isWatching: boolean;
}

export interface WekaFuncDefES6<Context> {
	meta: WekaFuncMeta;
	default: WekaFuncHandler<Context>;
}

/**
 * manages weka function definitions and their implementation handlers
 */
export default class FunctionStore<Context> {
	private funcs: { [key: string]: InternalWekaFunctionDef<Context> } = {};
	
	public addFunction(funcDef: InternalWekaFunctionDef<Context>) {
		const name = funcDef.meta.name;
		this.funcs[name] = funcDef;
		
		// todo: ensure the func def does not exist
	}
	
	public updateFunction(originalName: string, funcDef: InternalWekaFunctionDef<Context>) {
		const name = funcDef.meta.name;
		this.funcs[name] = funcDef;
		
		// if the name changed, then remove the old function
		
		if (name !== originalName) {
			delete this.funcs[originalName];
		}
		
		// todo: ensure the func def exists
	}
	
	public getFunction(name: string) {
		const func = this.funcs[name];
		
		if (func === undefined) {
			throw new Error(`could not invoke event because no function named "${name}" was registered`);
		}
		
		return func;
	}
	
	public static getFunctionHandlerFromDef<Context>(funcDef: WekaFuncDef<Context> | WekaFuncDefES6<Context> | InternalWekaFunctionDef<Context>): WekaFuncHandler<Context> {
		return (funcDef as WekaFuncDef<Context>).handler || (funcDef as WekaFuncDefES6<Context>).default;
	}
	
	public findByPath(path: string): InternalWekaFunctionDef<Context> | undefined {
		for (const [name, value] of Object.entries(this.funcs)) {
			if (value.path === path) {
				return value;
			}
		}
		
		return undefined;
	}
	
	public getAll(): InternalWekaFunctionDef<Context>[] {
		return Object.values(this.funcs);
	}
	
	public getAllWithSpecifiedPath(): InternalWekaFunctionDef<Context>[] {
		return this.getAll().filter((f: InternalWekaFunctionDef<Context>) => f.path !== undefined);
	}
	
	public removeFunction(name: string) {
		if (this.funcs[name] === undefined) {
			throw new Error(`weka could not remove function named "${name}" because it was not found in the function store`);
		}
		
		delete this.funcs[name];
	}
	
	public burstFunction(funcDef: InternalWekaFunctionDef<Context>): void {
		if (typeof funcDef.path !== "string") {
			throw new Error("weka could not burst function cache for function with no file path specified");
		}
		
		// burst the cache
		
		delete require.cache[require.resolve(funcDef.path!)];
		
		// add a fresh entry to the cache
		
		const newFuncDef = require(funcDef.path);
		const internalFucDef: InternalWekaFunctionDef<Context> = {
			...funcDef,
			meta: newFuncDef.meta,
			handler: FunctionStore.getFunctionHandlerFromDef(newFuncDef)
		};

		this.updateFunction(funcDef.meta.name, internalFucDef);
	}
	
	public burstAllFunctions(): void {
		for (const funcDef of this.getAllWithSpecifiedPath()) {
			this.burstFunction(funcDef);
		}
	}
}
