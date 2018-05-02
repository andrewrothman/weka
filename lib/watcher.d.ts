export interface WatcherOptions {
    onWatchedPathChanged: (eventType: string, changedPath: string) => void;
}
export declare class Watcher {
    private options;
    private watcher;
    constructor(options: WatcherOptions);
    startWatchingPaths(paths: string[]): void;
    private setupWatcherHandler(watcher);
}
