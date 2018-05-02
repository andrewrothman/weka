import { WekaEvent } from "@src";

export const meta = {
	name: "func_2",
	http: {
		method: "GET",
		path: "/func2"
	}
};

export default function (event: WekaEvent) {
	return "Hi, I'm function 2.";
}
