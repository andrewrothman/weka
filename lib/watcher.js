"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chokidar = require("chokidar");
var Watcher = /** @class */ (function () {
    function Watcher(options) {
        this.options = options;
        this.watcher = undefined;
    }
    Watcher.prototype.startWatchingPaths = function (paths) {
        if (this.watcher === undefined) {
            this.watcher = chokidar.watch(paths);
            this.setupWatcherHandler(this.watcher);
        }
        else {
            this.watcher.add(paths);
        }
    };
    Watcher.prototype.setupWatcherHandler = function (watcher) {
        var _this = this;
        watcher.on("ready", function () {
            watcher.on("all", _this.options.onWatchedPathChanged);
        });
    };
    return Watcher;
}());
exports.Watcher = Watcher;
//# sourceMappingURL=watcher.js.map