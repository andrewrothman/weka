"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var Koa = require("koa");
var pathToRegexp = require("path-to-regexp");
var bodyParser = require("koa-bodyparser");
var TRIGGER_NAME = "http";
var DEFAULT_HTTP_PORT = 3000;
var WekaHttp = /** @class */ (function () {
    function WekaHttp(weka, options) {
        this.healthEndpointEnabled = true;
        this.port = DEFAULT_HTTP_PORT;
        this.enabledTypes = ["json", "form"];
        this.bodyParserFormLimit = "56kb";
        this.bodyParserJsonLimit = "1mb";
        this.bodyParserStrict = true;
        this.autoExposeEnabled = true;
        this.autoExposePathPrefix = "/functions";
        this.port = Number.parseInt(process.env.WEKA_HTTP_PORT || "") || (options || {}).port || this.port;
        if (typeof this.port !== "number") {
            throw new Error("weka-http \"port\" option must be a number");
        }
        if (options !== undefined) {
            if (options.healthEndpointEnabled === false) {
                this.healthEndpointEnabled = false;
            }
            if (typeof options.autoExpose !== "undefined") {
                if (typeof options.autoExpose.enabled !== "undefined") {
                    this.autoExposeEnabled = options.autoExpose.enabled;
                }
                if (typeof options.autoExpose.pathPrefix !== "undefined") {
                    this.autoExposePathPrefix = options.autoExpose.pathPrefix;
                }
            }
            if (options.bodyParser !== undefined) {
                if (options.bodyParser.formLimit !== undefined) {
                    this.bodyParserFormLimit = options.bodyParser.formLimit;
                }
                if (options.bodyParser.jsonLimit !== undefined) {
                    this.bodyParserFormLimit = options.bodyParser.jsonLimit;
                }
                if (options.bodyParser.strict !== undefined) {
                    this.bodyParserStrict = options.bodyParser.strict;
                }
            }
        }
        this.app = new Koa();
    }
    WekaHttp.prototype.parsePathAndCompare = function (p1, p2) {
        var keys = [];
        var regexp = pathToRegexp(p1, keys);
        var doesMatch = p2.match(regexp) !== null;
        var regexpValues = doesMatch ? regexp.exec(p2) : {};
        var values = {};
        if (regexpValues !== undefined) {
            for (var i = 0; i < keys.length; i++) {
                var reqPathKey = keys[i];
                values[reqPathKey.name] = regexpValues[i + 1];
            }
        }
        return {
            values: values,
            doesMatch: doesMatch
        };
    };
    WekaHttp.prototype.collectArgs = function (urlValues, ctx) {
        var args = {};
        // merge in body params
        args = __assign({}, args, urlValues);
        // merge in query params
        args = __assign({}, args, ctx.query);
        // merge in body parser params (if correct content-type specified)
        if (ctx.get("content-type") === "application/json" || ctx.get("content-type") === "application/x-www-form-urlencoded") {
            args = __assign({}, args, ctx.request.body);
        }
        return args;
    };
    WekaHttp.prototype.respond = function (funcRes, ctx) {
        if (typeof funcRes === "string") {
            ctx.body = funcRes;
        }
        else if (typeof funcRes === "object") {
            ctx.status = funcRes.statusCode || 200;
            var headers = {};
            var bodyStr = "{}";
            if (typeof funcRes.body === "object") {
                bodyStr = JSON.stringify(funcRes.body);
                headers["Content-Type"] = "application/json";
            }
            else {
                // todo: might not be string serializable
            }
            headers = __assign({}, headers, (funcRes.headers || {}));
            ctx.body = funcRes.body || "{}";
            for (var _i = 0, _a = Object.entries(headers); _i < _a.length; _i++) {
                var _b = _a[_i], headerName = _b[0], headerValue = _b[1];
                ctx.set(headerName, headerValue);
            }
        }
        else {
            throw new Error("weka http function return should be either a string or object, but received type \"" + typeof funcRes + "\"");
        }
    };
    WekaHttp.prototype.attach = function (weka) {
        var _this = this;
        this.app.use(bodyParser({
            jsonLimit: this.bodyParserJsonLimit,
            formLimit: this.bodyParserFormLimit,
            strict: this.bodyParserStrict
        }));
        this.app.use(function (ctx) { return __awaiter(_this, void 0, void 0, function () {
            var _i, _a, funcDef, funcHttpMethod, funcHttpPath, reqHttpPath, funcDefMatch, autoExposeMatch, args, funcRes, args, funcRes;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // if the health endpoint is enabled, then return a 200 on the "/healthz" path
                        // this is a docker and kubernetes standard that was put in practice by Google
                        if (this.healthEndpointEnabled) {
                            if (ctx.path === "/healthz") {
                                ctx.status = 200;
                                ctx.res.end("OK");
                                return [2 /*return*/];
                            }
                        }
                        _i = 0, _a = weka.getAllFunctions();
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        funcDef = _a[_i];
                        funcHttpMethod = ((funcDef.meta.http || {}).method || "").toLowerCase();
                        funcHttpPath = ((funcDef.meta.http || {}).path || "");
                        reqHttpPath = ctx.request.url.split("?")[0];
                        funcDefMatch = this.parsePathAndCompare(funcHttpPath, reqHttpPath);
                        autoExposeMatch = this.parsePathAndCompare(this.autoExposePathPrefix + "/" + funcDef.meta.name, reqHttpPath);
                        if (!funcDefMatch.doesMatch) return [3 /*break*/, 3];
                        args = this.collectArgs(funcDefMatch.values, ctx);
                        return [4 /*yield*/, weka.invoke({
                                trigger: TRIGGER_NAME,
                                function: funcDef.meta.name,
                                args: args
                            })];
                    case 2:
                        funcRes = _b.sent();
                        this.respond(funcRes, ctx);
                        return [2 /*return*/];
                    case 3:
                        if (!(this.autoExposeEnabled && autoExposeMatch.doesMatch && (funcHttpMethod === "" || funcHttpMethod === ctx.method.toLowerCase()) && funcHttpPath === "")) return [3 /*break*/, 5];
                        args = this.collectArgs(autoExposeMatch.values, ctx);
                        return [4 /*yield*/, weka.invoke({
                                trigger: TRIGGER_NAME,
                                function: funcDef.meta.name,
                                args: args
                            })];
                    case 4:
                        funcRes = _b.sent();
                        this.respond(funcRes, ctx);
                        return [2 /*return*/];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
        this.app.listen(this.port);
        console.log("weka-http listening on port " + this.port + "...");
        return {
            triggerName: TRIGGER_NAME
        };
    };
    return WekaHttp;
}());
exports.default = WekaHttp;
//# sourceMappingURL=http.js.map