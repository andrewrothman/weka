type FuncResult = any;
type FuncMeta = { name: string } & { [key: string]: any };
type FuncHandler<Context> = (event: WekaEvent, ctx: Context) => FuncResult | Promise<FuncResult>;

export interface WekaEvent {
	trigger: string;
	function: string;
	args: { [key: string]: any };
}

export interface WekaFuncDef<Context> {
	meta: FuncMeta;
	handler: FuncHandler<Context>;
}

export interface WekaFuncDefES6<Context> {
	meta: FuncMeta;
	default: FuncHandler<Context>;
}

type TrigDef<Context> = any & {
	name: string;
	setup: (weka: Weka<Context>, options: { [key: string]: any }) => object | undefined;
};

type PreInvokeHandler<Context> = (event: WekaEvent, context: Context) => boolean | Promise<boolean>;

export default class Weka<Context> {
	public readonly funcs: { [key: string]: WekaFuncDef<Context> } = {};
	public readonly trigs: { [key: string]: TrigDef<Context> } = {};
	private preInvokeHandlers: PreInvokeHandler<Context>[] = [];
	
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
			handler: (funcDef as WekaFuncDef<Context>).handler || (funcDef as WekaFuncDefES6<Context>).default
		};
	}
	
	public registerTrigger(trigger: TrigDef<Context>, options: { [key: string]: any } = {}) {
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
	
	public addPreInvokeHandler(handler: PreInvokeHandler<Context>) {
		this.preInvokeHandlers.push(handler);
	}
}
