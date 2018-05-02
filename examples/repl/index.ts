import Weka from "@src";
import WekaRepl from "@src/repl";
import WekaHttp from "@src/trigs/http";

import "@src/repl";

import * as greeter from "./funcs/greeter";

const weka = new Weka();
weka.registerTrigger(new WekaHttp());
weka.registerFunction(greeter);
weka.use(new WekaRepl(weka));
