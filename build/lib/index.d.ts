export declare type WekaFuncResult = any;
export declare type WekaFuncMeta = {
    name: string;
} & {
    [key: string]: any;
};
export declare type WekaFuncHandler<Context> = (event: WekaEvent, ctx: Context) => WekaFuncResult | Promise<WekaFuncResult>;
export interface WekaEvent {
    trigger: string;
    function: string;
    args: {
        [key: string]: any;
    };
}
export interface WekaFuncDef<Context> {
    meta: WekaFuncMeta;
    handler: WekaFuncHandler<Context>;
}
export interface WekaFuncDefES6<Context> {
    meta: WekaFuncMeta;
    default: WekaFuncHandler<Context>;
}
export declare type WekaTrigDef<Context> = any & {
    name: string;
    setup: (weka: Weka<Context>, options: {
        [key: string]: any;
    }) => object | undefined;
};
export declare type WekaPreInvokeHandler<Context> = (event: WekaEvent, context: Context) => boolean | Promise<boolean>;
export default class Weka<Context> {
    readonly funcs: {
        [key: string]: WekaFuncDef<Context>;
    };
    readonly trigs: {
        [key: string]: WekaTrigDef<Context>;
    };
    private preInvokeHandlers;
    registerFunction(funcDef: WekaFuncDef<Context> | WekaFuncDefES6<Context>): void;
    registerTrigger(trigger: WekaTrigDef<Context>, options?: {
        [key: string]: any;
    }): any;
    invoke(event: WekaEvent): Promise<any>;
    addPreInvokeHandler(handler: WekaPreInvokeHandler<Context>): void;
}
