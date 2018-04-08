import "mocha";
import { expect } from "chai";
import Weka, { Event, FuncDef, FuncDefES6 } from "@src";

// todo: ensure errors are being thrown

describe("Invoke", () => {
	it("returns the response value of a basic lambda", async () => {
		const funcDef = {
			meta: {
				name: "basic"
			},
			default: () => {
				return "hello";
			}
		};
		
		const weka = new Weka();
		weka.registerFunction(funcDef);
		
		const result = await weka.invoke({
			trigger: "default",
			function: "basic",
			args: {}
		});
		
		expect(result).to.equal("hello");
	});
	
	it("returns the response value of a basic lambda with handler field", async () => {
		const funcDef = {
			meta: {
				name: "basic"
			},
			handler: () => {
				return "hello";
			}
		};

		const weka = new Weka();
		weka.registerFunction(funcDef);

		const result = await weka.invoke({
			trigger: "default",
			function: "basic",
			args: {}
		});

		expect(result).to.equal("hello");
	});
	
	it("provides arguments to a basic lambda function", async () => {
		const funcDef = {
			meta: {
				name: "echo"
			},
			default: (event: Event) => {
				return event.args.value;
			}
		};

		const weka = new Weka();
		weka.registerFunction(funcDef);

		const result = await weka.invoke({
			trigger: "default",
			function: "echo",
			args: {
				value: "hey there"
			}
		});
		
		expect(result).to.equal("hey there");
	});
	
	it("modifies context via middleware and provides it to a basic lambda function", async () => {
		interface EchoContext {
			suffix: string;
		}
		
		const funcDef: FuncDefES6<EchoContext> = {
			meta: {
				name: "echo"
			},
			default: (event: Event, context: EchoContext) => {
				return event.args.value + context.suffix;
			}
		};
		
		const weka = new Weka<EchoContext>();
		weka.registerFunction(funcDef);
		
		weka.addPreInvokeHandler((event: Event, context: EchoContext) => {
			context.suffix = "!";
			return true;
		});

		const result = await weka.invoke({
			trigger: "default",
			function: "echo",
			args: {
				value: "hey there"
			}
		});
		
		expect(result).to.equal("hey there!");
	});
});
