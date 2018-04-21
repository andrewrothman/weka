import { WekaEvent } from "@src";

import coolNumber from "./cool_number";

export const meta = {
	name: "greeter",
	http: {
		method: "GET",
		url: "/greet/:recipient"
	}
};

export default function (event: WekaEvent) {
	return `Hello, ${event.args.recipient}! You know which number is pretty cool? ${coolNumber}. Which one is your favorite?`;
}
