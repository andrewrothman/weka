import Weka from "@src";
import WekaHttp from "@src/trigs/http";

import * as path from "path";

const weka = new Weka({
	watchedPaths: [__dirname]
});

weka.registerTrigger(new WekaHttp());
weka.registerFuncsFromDirectoryPath("./funcs");
