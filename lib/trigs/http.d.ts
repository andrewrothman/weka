import Weka from "../";
import { WekaTriggerDef, WekaTriggerAttachInfo } from "../trig_store";
export interface WekaHttpOptions {
    port?: number;
    healthEndpointEnabled?: boolean;
    autoExpose?: {
        enabled?: boolean;
        pathPrefix?: string;
    };
    bodyParser?: {
        formLimit?: string;
        jsonLimit?: string;
        strict?: boolean;
    };
}
export default class WekaHttp<Context> implements WekaTriggerDef<Context> {
    private app;
    private healthEndpointEnabled;
    private port;
    private enabledTypes;
    private bodyParserFormLimit;
    private bodyParserJsonLimit;
    private bodyParserStrict;
    private autoExposeEnabled;
    private autoExposePathPrefix;
    constructor(options?: WekaHttpOptions);
    private parsePathAndCompare(p1, p2);
    private collectArgs(urlValues, ctx);
    private respond(funcRes, ctx);
    attach(weka: Weka<Context>): WekaTriggerAttachInfo;
}
