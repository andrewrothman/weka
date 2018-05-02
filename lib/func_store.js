"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * manages weka function definitions and their implementation handlers
 */
var FunctionStore = /** @class */ (function () {
    function FunctionStore() {
        this.funcs = {};
    }
    FunctionStore.prototype.addFunction = function (funcDef) {
        var name = funcDef.meta.name;
        this.funcs[name] = funcDef;
        // todo: ensure the func def does not exist
    };
    FunctionStore.prototype.updateFunction = function (originalName, funcDef) {
        var name = funcDef.meta.name;
        this.funcs[name] = funcDef;
        // if the name changed, then remove the old function
        if (name !== originalName) {
            delete this.funcs[originalName];
        }
        // todo: ensure the func def exists
    };
    FunctionStore.prototype.getFunction = function (name) {
        var func = this.funcs[name];
        if (func === undefined) {
            throw new Error("could not invoke event because no function named \"" + name + "\" was registered");
        }
        return func;
    };
    FunctionStore.getFunctionHandlerFromDef = function (funcDef) {
        return funcDef.handler || funcDef.default;
    };
    FunctionStore.prototype.findByPath = function (path) {
        for (var _i = 0, _a = Object.entries(this.funcs); _i < _a.length; _i++) {
            var _b = _a[_i], name = _b[0], value = _b[1];
            if (value.path === path) {
                return value;
            }
        }
        return undefined;
    };
    FunctionStore.prototype.getAll = function () {
        return Object.values(this.funcs);
    };
    FunctionStore.prototype.getAllWithSpecifiedPath = function () {
        return this.getAll().filter(function (f) { return f.path !== undefined; });
    };
    FunctionStore.prototype.removeFunction = function (name) {
        if (this.funcs[name] === undefined) {
            throw new Error("weka could not remove function named \"" + name + "\" because it was not found in the function store");
        }
        delete this.funcs[name];
    };
    FunctionStore.prototype.burstFunction = function (funcDef) {
        if (typeof funcDef.path !== "string") {
            throw new Error("weka could not burst function cache for function with no file path specified");
        }
        // burst the cache
        delete require.cache[require.resolve(funcDef.path)];
        // add a fresh entry to the cache
        var newFuncDef = require(funcDef.path);
        var internalFucDef = __assign({}, funcDef, { meta: newFuncDef.meta, handler: FunctionStore.getFunctionHandlerFromDef(newFuncDef) });
        this.updateFunction(funcDef.meta.name, internalFucDef);
    };
    FunctionStore.prototype.burstAllFunctions = function () {
        for (var _i = 0, _a = this.getAllWithSpecifiedPath(); _i < _a.length; _i++) {
            var funcDef = _a[_i];
            this.burstFunction(funcDef);
        }
    };
    return FunctionStore;
}());
exports.default = FunctionStore;
//# sourceMappingURL=func_store.js.map