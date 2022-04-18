# Redux Transform Stream

> A [`TransformStream`][TransformStream] for Redux

```typescript
// A few utility imports for this example
import { configureStore } from "https://esm.sh/@reduxjs/toolkit?target=deno";
import { readableStreamFromIterable } from "https://deno.land/std@0.135.0/streams/conversion.ts";

// The actual library!
import { ReduxTransformStream } from "https://deno.land/x/redux_transform_stream/mod.ts";

// The type of our Redux store's state
type State = `number`;

// The supported actions for our Redux store
type Action =
  | { type: "Increment" }
  | { type: "Decrement" };

// Define a Redux store that applies the `Action`s to our `State`
const store = configureStore<State, Action>({
  reducer: (state = 0, action) => {
    switch (action.type) {
      case "Increment":
        return state + 1;
      case "Decrement":
        return state - 1;
      default:
        return state;
    }
  },
});

// We need a `ReadableStream` of `Action`s; this utility allows us to make one from an Array, for demonstration purposes
const actionStream = readableStreamFromIterable<Action>([
  { type: "Increment" },
  { type: "Decrement" },
  { type: "Increment" },
]);

// Create a `TransformStream` from the Redux store
const transformStream = new ReduxTransformStream(store);

// By piping the stream of `Action`s through the Redux `TransformStream`, we end up with an output stream of `State`s
const stateStream = actionStream.pipeThrough(transformStream);

// Log each state; this will log the initial state (`0`) and then the updated value after each action is processed by Redux
for await (const state of stateStream) {
  console.log(state); // In sequence: 0, 1, 0, 1
}
```

[TransformStream]: https://developer.mozilla.org/en-US/docs/Web/API/TransformStream/TransformStream
[redux]: https://redux.js.org
