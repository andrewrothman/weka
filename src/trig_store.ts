import Weka from "./";

export interface WekaTriggerAttachInfo {
	triggerName: string;
}

export interface WekaTriggerDef<Context> {
	attach(weka: Weka<Context>): WekaTriggerAttachInfo;
}

export default class TriggerStore<Context> {
	private trigs: { [key: string]: WekaTriggerDef<Context> } = {};
	
	public registerTrigger(trigger: WekaTriggerDef<Context>, attachInfo: WekaTriggerAttachInfo) {
		const triggerName: string = attachInfo.triggerName;

		if (typeof triggerName !== "string") {
			throw new Error("weka trigger registration \"name\" field must be a string");
		}

		this.trigs[triggerName] = trigger;
	}
	
	public unregisterTrigger(triggerName: string) {
		if (this.trigs[triggerName] === undefined) {
			throw new Error(`weka could not remove trigger named "${triggerName}" because it was not found in the trigger store`);
		}

		delete this.trigs[triggerName];
	}
}