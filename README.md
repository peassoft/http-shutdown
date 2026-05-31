# @peassoft/app-shutdown

This module provides a class that helps organize an application gracefull shutdown flow in a sequence meaningful for that application.

## Installation

```shell
$ npm i @peassoft/app-shutdown
```

## Usage Example

```ts
import { AppShutdown, type WithShutdown } from '@peassoft/app-shutdown';

const httpServer: WithShutdown = createHttpServerWithShutdown(/* ... */);
const dbConnection = createDbConnection(/* ... */);
const messageBrokerConnection = createMessageBrokerConnection(/* ... */);

const appShutdown = new AppShutdown(
  [
    // First, we'll gracefully stop our HTTP server and terminate all underlying connections.
    // (Note that `httpServer` object implements `WithShutdown` interface, and thus has
    // a method `shutdown`. Therefore, we pass the object directly.)
    httpServer,

    // After we're sure our HTTP server is stopped and all ongoing requests are served,
    // we can close connections to the database and the message broker in parallel.
    // (Note that in most cases we need to `bind` methods like `close` as they might use `this`
    // internally.)
    [
      dbConnection.close.bind(dbConnection),
      messageBrokerConnection.close.bind(messageBrokerConnection),
    ],
  ],
  {
    // After this timeout, the process will be terminated even if not all clean-up steps have
    // finished.
    timeoutMs: 20_000,
  },
);

process.on('SIGINT', () => void appShutdown.shutdown(0));
process.on('SIGTERM', () => void appShutdown.shutdown(0));

process.on('uncaughtException', err => {
  yourLogger(err);
  void appShutdown.shutdown(1);
});
```

## API Reference

### `ShutdownStep`

```ts
type ShutdownStep = ShutdownFn | ShutdownFn[] | WithShutdown | WithShutdown[];

type ShutdownFn = () => Promise<unknown>;

interface WithShutdown {
  shutdown(): Promise<unknown>;
}
```

A shutdown step may be a function returning a `Promise<void>`, or an object that has a `shutdown` method returning a `Promise<void>`, or an array of such functions and/or objects.

All steps a executed serially (one after another) in the order they are passed in the constructor. If a step is an array, all elements of the array are executed in-parallel (using `Promise.allSettled()`).

Any promise rejections are caught and ignored.

### `AppShutdownOptions`

```ts
type AppShutdownOptions = {
  /**
   * Timeout in milliseconds after which the process is exited without waiting remaining
   * shutdown steps to complete. Optional. Defaults to `15_000`.
   */
  timeoutMs?: number;
};
```

### `constructor(steps: ShutdownStep[], options?: AppShutdownOptions)`

Class constructor.

Although `AppShutdown` class does not prevent creating multiple instances, you'll definitely want to have a single instance per application.

### Instance Methods

#### `shutdown(exitCode?: number) => Promise<void>`

Execute graceful shutdown of the application.

You can pass `exitCode` parameter; this value will be used as the process exit code. Defaults to `0`.


## Other Considerations

### Timeouts

You should implement meaningful timeouts for each shutdown step (out of scope of this module), as well as tune the overall shutdown timeout (passed in the constructor of `AppShutdown`) to be grater than the estimated sum of timeouts of all shutdown steps (taking into account possible parallel execution).
