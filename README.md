# Weka

A JavaScript lambda function supervisor.

**Please note** that Weka is NOT related to AWS Lambda, FaaS platforms, or serverless applications.
Instead, the goal of Weka is to introduce the benefits of self-contained functions to traditional
monolithic JavaScript applications.

## What Is It?

Are you used to seeing your Koa or Express route handlers span hundreds or thousands of lines?
Like this?

```javascript
1000    app.get("/todos", ctx => {
1001        const pageNumber = ctx.request.query.pageNumber;
1002    }
1003
1004    app.post("/todos", ctx => {
1005        const title = ctx.request.body.title;
1006    }
        ... and on and on for a few thousand more lines
```

Looking for easier development and debugging of your monolithic NodeJS app?

How about unit testing as easy as pie?

Then Weka is right for you!

Weka restructures your application into a whole bunch of independent lambda functions, and allows you to develop, invoke, and test them easily!

`./greeter.ts`

```typescript
export const meta = {
    name: "greeter"
};

export default function (event: Event) {
    return `Hello, ${event.args.recipient}!`;
}
```

`index.ts`

```typescript
import Weka from "weka";
import * as greeter from "./greeter";

const weka = new Weka();
weka.registerFunction(greeter);

const result = weka.invoke({
    trigger: "default",
    function: "greeter",
    args: { recipient: "Weka" }
});

console.log(result);  // -> "Hello, Weka!"
```

## How Should I Use It In HTTP Servers?

Weka is based around the concepts of `functions`, `events`, and `triggers`. Events are simple JavaScript objects that describe some event along with the name of a function to handle it, functions you register can then wait for events and perform any necessary computations (ie. change database entries, communicate with external APIs, etc.), before responding to the event by returning a value. Functions can also use async/await syntax or return a Promise for asynchronous processing.

Triggers allow for external code to invoke your functions, such as the included `weka-http` trigger. This trigger is based off of a standard Koa app and can be easily integrated into any existing Koa, Express, or http.createServer monolith.

By adding a few lines of code in our function meta:

`greeter.ts`

```typescript
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
```

And registering the http trigger:

`index.ts`

```typescript
import Weka from "weka";
import WekaHttp from "weka/trigs/http";

import * as greeter from "./greeter";

const weka = new Weka();
weka.registerTrigger(WekaHttp);
weka.registerFunction(greeter);
```

We can easily call our function via cURL!

```bash
-> curl -X GET http://localhost:3000/greet/Weka
Hello, Weka!
```

Adding more functions is very easy, and managing your huge monolithic NodeJS project becomes a dream.

## What's The Benefit During Development?

TODO

* hot reloading - TBA
* repl - TBA

## I Like Unit Tests

TODO

I do too, but this section/feature hasn't been finished yet.

## But What If I Use Babel/Flow/TypeScript?

TODO

Are you kidding? This whole thing is written in TypeScript! You think I'd leave you in agony trying to stitch this into your transpilation process?

Well, for now I am, because I haven't figured this out yet, especially when it comes to hot-reloading, which is also not developed yet. But this is a very high priority for me to figure out.

## Real-World Usage

Not yet. Please don't.

## Contributions

I'm [Andrew Rothman](https://andrewrothman.com), and I made this. If you have some suggestions, or can contribute code, please post an issue or submit a pull request through GitHub. If it's substantial and you like publicity, expect your name to be here in the future!