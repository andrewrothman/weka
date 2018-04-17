"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Weka = /** @class */ (function () {
    function Weka() {
        this.funcs = {};
        this.trigs = {};
        this.preInvokeHandlers = [];
    }
    Weka.prototype.registerFunction = function (funcDef) {
        if (typeof funcDef !== "object") {
            throw new Error("weka function registration parameter must be an object");
        }
        if (typeof funcDef.meta !== "object") {
            throw new Error("weka function registration parameter must include a \"meta\" object field");
        }
        if (typeof funcDef.meta.name !== "string") {
            throw new Error("weka function registration parameter must include a \"name\" string meta field");
        }
        if (typeof funcDef.handler !== "function" && typeof funcDef.default !== "function") {
            throw new Error("weka function registration parameter must include a default function export field or a \"handler\" field");
        }
        var name = funcDef.meta.name;
        this.funcs[name] = {
            meta: funcDef.meta,
            handler: funcDef.handler || funcDef.default
        };
    };
    Weka.prototype.registerTrigger = function (trigger, options) {
        if (options === void 0) { options = {}; }
        if (typeof trigger.name !== "string") {
            throw new Error("weka trigger registration \"name\" field must be a string");
        }
        var returnValue = trigger.setup.apply(trigger, [this, options]);
        this.trigs[trigger.name] = trigger;
        return returnValue;
    };
    Weka.prototype.invoke = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var context, _i, _a, handler, shouldContinue, func;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (typeof event.trigger !== "string") {
                            throw new Error("weka event invocation \"trigger\" field must be a string");
                        }
                        if (typeof event.function !== "string") {
                            throw new Error("weka event invocation \"function\" field must be a string");
                        }
                        context = {};
                        _i = 0, _a = this.preInvokeHandlers;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        handler = _a[_i];
                        return [4 /*yield*/, handler(event, context)];
                    case 2:
                        shouldContinue = _b.sent();
                        if (shouldContinue === false) {
                            // do not invoke
                            return [2 /*return*/];
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        func = this.funcs[event.function];
                        if (func === undefined) {
                            throw new Error("could not invoke event because no function named \"" + event.function + "\" was registered");
                        }
                        return [2 /*return*/, this.funcs[event.function].handler(event, context)];
                }
            });
        });
    };
    Weka.prototype.addPreInvokeHandler = function (handler) {
        this.preInvokeHandlers.push(handler);
    };
    return Weka;
}());
exports.default = Weka;
//# sourceMappingURL=index.js.map