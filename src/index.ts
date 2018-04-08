type FuncResult = any;
type FuncMeta = { name: string } & { [key: string]: any };
type FuncHandler = (event: Event, ctx: any /* todo */) => FuncResult | Promise<FuncResult>;

export interface Event {
	trigger: string;
	function: string;
	args: { [key: string]: any };
}

interface FuncDef {
	meta: FuncMeta;
	handler: FuncHandler;
}

interface FuncDefES6 {
	meta: FuncMeta;
	default: FuncHandler;
}

type TrigDef = any & {
	name: string;
	setup: (weka: Weka, options: { [key: string]: any }) => object | undefined;
};

type PreInvokeHandler = (event: Event, context: any) => boolean | Promise<boolean>;

export default class Weka {
	public readonly funcs: { [key: string]: FuncDef } = {};
	public readonly trigs: { [key: string]: TrigDef } = {};
	private preInvokeHandlers: PreInvokeHandler[] = [];
	
	public registerFunction(funcDef: FuncDefES6) {
		if (typeof funcDef !== "object") {
			throw new Error("weka function registration parameter must be an object");
		}
		
		if (typeof funcDef.meta !== "object") {
			throw new Error("weka function registration parameter must include a \"meta\" object field");
		}
		
		if (typeof funcDef.meta.name !== "string") {
			throw new Error("weka function registration parameter must include a \"name\" string meta field");
		}
		
		if (typeof funcDef.default !== "function") {
			throw new Error("weka function registration parameter must include a default function export field");
		}
		
		const name = funcDef.meta.name;
		
		this.funcs[name] = {
			meta: funcDef.meta,
			handler: funcDef.default
		};
	}
	
	public registerTrigger(trigger: TrigDef, options: { [key: string]: any } = {}) {
		if (typeof trigger.name !== "string") {
			throw new Error("weka trigger registration \"name\" field must be a string");
		}
		
		const returnValue = trigger.setup.apply(trigger, [this, options]);
		this.trigs[trigger.name] = trigger;
		
		return returnValue;
	}
	
	public async invoke(event: Event) {
		if (typeof event.trigger !== "string") {
			throw new Error("weka event invocation \"trigger\" field must be a string");
		}
		
		if (typeof event.function !== "string") {
			throw new Error("weka event invocation \"function\" field must be a string");
		}
		
		const context: any = {};
		
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
	
	public addPreInvokeHandler(handler: PreInvokeHandler) {
		this.preInvokeHandlers.push(handler);
	}
}
