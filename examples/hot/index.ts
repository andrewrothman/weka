import Weka from "@src";
import WekaHttp from "@src/trigs/http";

const weka = new Weka();
weka.registerTrigger(WekaHttp);
weka.registerFuncFromPath("./funcs/greeter");
