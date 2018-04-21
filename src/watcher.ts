import * as chokidar from "chokidar";

export interface WatcherOptions {
	onWatchedPathChanged: (eventType: string, changedPath: string) => void;
}

export class Watcher {
	private watcher: chokidar.FSWatcher | undefined = undefined;
	
	constructor(private options: WatcherOptions) {
		
	}
	
	public startWatchingPaths(paths: string[]) {
		if (this.watcher === undefined) {
			this.watcher = chokidar.watch(paths);
			this.setupWatcherHandler(this.watcher);
		}
		else {
			this.watcher.add(paths);
		}
	}
	
	private setupWatcherHandler(watcher: chokidar.FSWatcher) {
		watcher.on("ready", () => {
			watcher.on("all", this.options.onWatchedPathChanged);
		});
	}
}
