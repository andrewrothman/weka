import { WekaFuncDef, WekaFuncDefES6, InternalWekaFunctionDef } from "./func_store";
import { WekaTriggerDef } from "./trig_store";
export interface WekaEvent {
    trigger: string;
    function: string;
    args: {
        [key: string]: any;
    };
}
export declare type WekaPreInvokeHandler<Context> = (event: WekaEvent, context: Context) => boolean | Promise<boolean>;
export interface WekaOptions {
    watchedPaths?: string[];
    hotReloadEnabled?: boolean;
}
export default class Weka<Context> {
    private funcStore;
    private trigStore;
    private preInvokeHandlers;
    private watcher;
    private hotReloadEnabled;
    constructor(options?: WekaOptions);
    registerFunction(funcDef: WekaFuncDef<Context> | WekaFuncDefES6<Context>): void;
    registerFuncFromPath(filePath: string, shouldWatch?: boolean): void;
    registerFuncsFromDirectoryPath(dirPath: string, shouldWatch?: boolean): void;
    unregisterFunction(funcName: string): void;
    registerTrigger(trigger: WekaTriggerDef<Context>): void;
    unregisterTrigger(triggerName: string): void;
    invoke(event: WekaEvent): Promise<any>;
    runPreInvokeHandlers(event: WekaEvent, context: Context): Promise<boolean>;
    addPreInvokeHandler(handler: WekaPreInvokeHandler<Context>): void;
    private onWatchedPathChanged(eventType, changedPath);
    getAllFunctions(): InternalWekaFunctionDef<Context>[];
}
