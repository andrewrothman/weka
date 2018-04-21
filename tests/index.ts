import "mocha";
import { expect } from "chai";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import Weka, { WekaEvent, WekaFuncDef, WekaFuncDefES6 } from "@src";

chai.use(chaiAsPromised);

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
			default: (event: WekaEvent) => {
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
		
		const funcDef: WekaFuncDefES6<EchoContext> = {
			meta: {
				name: "echo"
			},
			default: (event: WekaEvent, context: EchoContext) => {
				return event.args.value + context.suffix;
			}
		};
		
		const weka = new Weka<EchoContext>();
		weka.registerFunction(funcDef);
		
		weka.addPreInvokeHandler((event: WekaEvent, context: EchoContext) => {
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
	
	it("unregisters a previously-registered function", async () => {
		interface EchoContext {
			suffix: string;
		}

		const funcDef: WekaFuncDefES6<EchoContext> = {
			meta: {
				name: "echo"
			},
			default: (event: WekaEvent) => {
				return event.args.value;
			}
		};

		const weka = new Weka<EchoContext>();
		weka.registerFunction(funcDef);

		const result = await weka.invoke({
			trigger: "default",
			function: "echo",
			args: {
				value: "hey there"
			}
		});

		expect(result).to.equal("hey there");
		
		weka.unregisterFunction("echo");

		return (expect(weka.invoke({
			trigger: "default",
			function: "echo",
			args: {
				value: "hey there"
			}
		})).to.be as any).rejected;
	});
});
