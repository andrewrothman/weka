import Weka from "./";
export interface WekaTriggerAttachInfo {
    triggerName: string;
}
export interface WekaTriggerDef<Context> {
    attach(weka: Weka<Context>): WekaTriggerAttachInfo;
}
export default class TriggerStore<Context> {
    private trigs;
    registerTrigger(trigger: WekaTriggerDef<Context>, attachInfo: WekaTriggerAttachInfo): void;
    unregisterTrigger(triggerName: string): void;
}
