import { WekaEvent } from "@src";

export const meta = {
	name: "func_1",
	http: {
		method: "GET",
		path: "/func1"
	}
};

export default function (event: WekaEvent) {
	return "Hi, I'm function 1.";
}
