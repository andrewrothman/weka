import { WekaEvent } from "@src";

export const meta = {
	name: "greeter",
	http: {
		method: "GET",
		url: "/greet/:recipient"
	}
};

export default function (event: WekaEvent) {
	return `Hello, ${event.args.recipient}!`;
}
