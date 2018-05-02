"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TriggerStore = /** @class */ (function () {
    function TriggerStore() {
        this.trigs = {};
    }
    TriggerStore.prototype.registerTrigger = function (trigger, attachInfo) {
        var triggerName = attachInfo.triggerName;
        if (typeof triggerName !== "string") {
            throw new Error("weka trigger registration \"name\" field must be a string");
        }
        this.trigs[triggerName] = trigger;
    };
    TriggerStore.prototype.unregisterTrigger = function (triggerName) {
        if (this.trigs[triggerName] === undefined) {
            throw new Error("weka could not remove trigger named \"" + triggerName + "\" because it was not found in the trigger store");
        }
        delete this.trigs[triggerName];
    };
    return TriggerStore;
}());
exports.default = TriggerStore;
//# sourceMappingURL=trig_store.js.map