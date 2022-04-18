import { assertEquals } from "https://deno.land/std@0.135.0/testing/asserts.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  spy,
  stub,
} from "https://deno.land/std@0.135.0/testing/mock.ts";

import { configureStore } from "https://esm.sh/@reduxjs/toolkit?target=deno";
import { readableStreamFromIterable } from "https://deno.land/std@0.135.0/streams/conversion.ts";

import { ReduxTransformStream } from "./mod.ts";

type Action =
  | { type: "Increment" }
  | { type: "Decrement" };

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];

  for await (const item of iter) {
    result.push(item);
  }

  return result;
}

Deno.test("converting actions to states", async () => {
  const store = configureStore<number, Action>({
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

  const actionStream = readableStreamFromIterable<Action>([
    { type: "Increment" },
    { type: "Decrement" },
    { type: "Increment" },
  ]);
  const transformStream = new ReduxTransformStream(store);

  const stateStream = actionStream.pipeThrough(transformStream);
  const states = await collect(stateStream);

  assertEquals(states, [
    // Initial state
    0,
    // Future states from actions
    1,
    0,
    1,
  ]);
});

Deno.test("unsubscribing when the stream completed", async () => {
  const store = configureStore<number, Action>({
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

  const unsubscribe = spy();
  const subscribe = stub(store, "subscribe", () => unsubscribe);

  assertSpyCalls(subscribe, 0);

  const actionStream = readableStreamFromIterable<Action>([]);
  const transformStream = new ReduxTransformStream(store);

  assertSpyCalls(subscribe, 1);
  assertSpyCalls(unsubscribe, 0);

  const stateStream = actionStream.pipeThrough(transformStream);
  await collect(stateStream);

  assertSpyCalls(unsubscribe, 1);
  assertSpyCall(unsubscribe, 0, {
    args: [],
  });
});
