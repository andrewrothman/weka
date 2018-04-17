/// <reference types="koa" />
import Weka from "@src";
import * as Koa from "koa";
declare const _default: {
    name: string;
    app: Koa;
    setup(weka: Weka<any>, options: {
        [key: string]: any;
    }): object;
};
export default _default;
