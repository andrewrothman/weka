import Weka from "@src";
import WekaHttp from "@src/trigs/http";

import * as greeter from "./funcs/greeter";

const weka = new Weka();
weka.registerTrigger(WekaHttp);
weka.registerFunction(greeter);
