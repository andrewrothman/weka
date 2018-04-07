import { Event } from "@src";

export const meta = {
	name: "greeter",
	http: {
		method: "GET",
		url: "/greet/:recipient"
	}
};

export default function (event: Event) {
	return `Hello, ${event.args.recipient}!`;
}
