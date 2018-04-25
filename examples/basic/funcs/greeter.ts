import { WekaEvent } from "@src";

export const meta = {
	name: "greeter",
	http: {
		method: "GET",
		path: "/greet/:recipient"
	}
};

export default function (event: WekaEvent) {
	return `Hello, ${event.args.recipient}!`;
}
