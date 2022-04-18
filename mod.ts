type Unsubscribe = () => void;

interface Store<State, Action> {
  getState(): State;

  dispatch(action: Action): void;

  subscribe(listener: () => void): Unsubscribe;
}

export class ReduxTransformStream<Action, State>
  extends TransformStream<Action, State> {
  constructor(store: Store<State, Action>) {
    let unsubscribe: Unsubscribe;

    super({
      start(controller) {
        // Immediately emit the initial state of the store
        controller.enqueue(store.getState());

        // Subscribe to future states, so we can emit those too
        unsubscribe = store.subscribe(() => {
          controller.enqueue(store.getState());
        });
      },

      transform(action) {
        store.dispatch(action);
      },

      flush() {
        unsubscribe();
      },
    });
  }
}
