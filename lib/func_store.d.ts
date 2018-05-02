import { WekaEvent } from "@src";
export declare type WekaFuncResult = any;
export declare type WekaFuncMeta = {
    name: string;
} & {
    [key: string]: any;
};
export declare type WekaFuncHandler<Context> = (event: WekaEvent, ctx: Context) => WekaFuncResult | Promise<WekaFuncResult>;
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
    private funcs;
    addFunction(funcDef: InternalWekaFunctionDef<Context>): void;
    updateFunction(originalName: string, funcDef: InternalWekaFunctionDef<Context>): void;
    getFunction(name: string): InternalWekaFunctionDef<Context>;
    static getFunctionHandlerFromDef<Context>(funcDef: WekaFuncDef<Context> | WekaFuncDefES6<Context> | InternalWekaFunctionDef<Context>): WekaFuncHandler<Context>;
    findByPath(path: string): InternalWekaFunctionDef<Context> | undefined;
    getAll(): InternalWekaFunctionDef<Context>[];
    getAllWithSpecifiedPath(): InternalWekaFunctionDef<Context>[];
    removeFunction(name: string): void;
    burstFunction(funcDef: InternalWekaFunctionDef<Context>): void;
    burstAllFunctions(): void;
}
