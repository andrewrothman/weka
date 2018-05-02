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
var callsite = require("callsite");
var path = require("path");
var fs = require("fs");
var watcher_1 = require("@src/watcher");
var func_store_1 = require("@src/func_store");
var trig_store_1 = require("@src/trig_store");
var Weka = /** @class */ (function () {
    function Weka(options) {
        this.funcStore = new func_store_1.default();
        this.trigStore = new trig_store_1.default();
        this.preInvokeHandlers = [];
        this.watcher = new watcher_1.Watcher({ onWatchedPathChanged: this.onWatchedPathChanged.bind(this) });
        this.hotReloadEnabled = process.env.NODE_ENV === undefined || process.env.NODE_ENV === "" || process.env.NODE_ENV === "development";
        if (options !== undefined) {
            if (options.hotReloadEnabled !== undefined) {
                this.hotReloadEnabled = options.hotReloadEnabled;
            }
            if (options.watchedPaths !== undefined && this.hotReloadEnabled) {
                this.watcher.startWatchingPaths(options.watchedPaths);
            }
        }
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
        var internalFucDef = {
            meta: funcDef.meta,
            handler: func_store_1.default.getFunctionHandlerFromDef(funcDef),
            path: undefined,
            isWatching: false
        };
        this.funcStore.addFunction(internalFucDef);
    };
    Weka.prototype.registerFuncFromPath = function (filePath, shouldWatch) {
        // todo: ensure the path points to a single file
        if (shouldWatch === void 0) { shouldWatch = true; }
        var stack = callsite();
        var requester = stack[1].getFileName();
        var finalModulePath = path.resolve(path.dirname(requester), filePath);
        var finalFilePath = require.resolve(finalModulePath);
        var stat = fs.statSync(finalFilePath);
        if (!stat.isFile) {
            throw new Error("weka could not register file path because path wasn't a file: " + finalModulePath);
        }
        var funcDef = require(finalModulePath);
        if (this.hotReloadEnabled && shouldWatch) {
            this.watcher.startWatchingPaths([finalFilePath]);
        }
        var internalFuncDef = {
            meta: funcDef.meta,
            handler: func_store_1.default.getFunctionHandlerFromDef(funcDef),
            path: finalFilePath,
            isWatching: true
        };
        this.funcStore.addFunction(internalFuncDef);
    };
    Weka.prototype.registerFuncsFromDirectoryPath = function (dirPath, shouldWatch) {
        // todo: ensure the path points to a directory
        if (shouldWatch === void 0) { shouldWatch = true; }
        var stack = callsite();
        var requester = stack[1].getFileName();
        var finalDirPath = path.join(requester, "../", dirPath);
        var stat = fs.statSync(finalDirPath);
        if (!stat.isDirectory) {
            throw new Error("weka could not register directory path because path wasn't a directory: " + finalDirPath);
        }
        var files = fs.readdirSync(finalDirPath);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var fileName = files_1[_i];
            this.registerFuncFromPath(path.join(finalDirPath, fileName), false);
        }
        if (shouldWatch && this.hotReloadEnabled) {
            this.watcher.startWatchingPaths([finalDirPath + "/**"]);
        }
    };
    Weka.prototype.unregisterFunction = function (funcName) {
        this.funcStore.removeFunction(funcName);
    };
    Weka.prototype.registerTrigger = function (trigger) {
        // todo: validate that "attach" exists
        var attachInfo = trigger.attach(this);
        this.trigStore.registerTrigger(trigger, attachInfo);
    };
    Weka.prototype.unregisterTrigger = function (triggerName) {
        this.trigStore.unregisterTrigger(triggerName);
    };
    Weka.prototype.invoke = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var func, context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof event.trigger !== "string") {
                            throw new Error("weka event invocation \"trigger\" field must be a string");
                        }
                        if (typeof event.function !== "string") {
                            throw new Error("weka event invocation \"function\" field must be a string");
                        }
                        func = this.funcStore.getFunction(event.function);
                        context = {};
                        return [4 /*yield*/, this.runPreInvokeHandlers(event, context)];
                    case 1:
                        if ((_a.sent()) === false) {
                            return [2 /*return*/];
                        }
                        return [2 /*return*/, func.handler(event, context)];
                }
            });
        });
    };
    Weka.prototype.runPreInvokeHandlers = function (event, context) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, handler, shouldContinue;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
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
                            return [2 /*return*/, false];
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, true];
                }
            });
        });
    };
    Weka.prototype.addPreInvokeHandler = function (handler) {
        this.preInvokeHandlers.push(handler);
    };
    Weka.prototype.onWatchedPathChanged = function (eventType, changedPath) {
        var func = this.funcStore.findByPath(changedPath);
        if (func !== undefined) {
            console.log("bursting", func.path);
            this.funcStore.burstFunction(func);
        }
        else {
            console.log("bursting", changedPath);
            // burst the cache for this file
            delete require.cache[require.resolve(changedPath)];
            console.log("bursting all functions");
            // if the file was not found, invalidate the cache for all functions (in case the file was a dependency of one of the functions)
            this.funcStore.burstAllFunctions();
        }
    };
    // todo: change this to getFunctions(callback(meta: WekaFuncMeta) => true | false): InternalWekaFuncDef
    // and use in koa
    // or, even, invoke by name and invokeWhere by meta, but this would be a larger architectural change
    Weka.prototype.getAllFunctions = function () {
        return this.funcStore.getAll();
    };
    return Weka;
}());
exports.default = Weka;
//# sourceMappingURL=index.js.map