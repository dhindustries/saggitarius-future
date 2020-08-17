import { Deferred } from "@saggitarius/deferred";

enum FutureState {
    Pending,
    Fullfilled,
    Rejected,
}

export class Future<T> implements Promise<T> {
    public [Symbol.toStringTag]: "Future";
    private deferred = new Deferred<T>();
    private state = FutureState.Pending;
    private value!: T;
    private error: unknown;

    public get(): Promise<T> {
        switch (this.state) {
        case FutureState.Fullfilled:
            return Promise.resolve(this.value);
        case FutureState.Rejected:
            return Promise.reject(this.error);
        case FutureState.Pending:
            return this.deferred.promise();
        }
    }

    public set(value: T) {
        this.state = FutureState.Fullfilled;
        this.value = value;
        this.deferred.resolve(value);
    }

    public fail(err: unknown) {
        this.state = FutureState.Rejected;
        this.error = err;
        this.deferred.reject(err);
    }

    public reset() {
        this.state = FutureState.Pending;
        this.value = undefined;
        this.error = undefined;
    }

    public readonly(): ReadonlyFuture<T> {
        return new ReadonlyFuture(this);
    }

    public then<TResult1 = T, TResult2 = never>(
        onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>, 
        onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
    ): Promise<TResult1 | TResult2> {
        return this.get().then(onfulfilled, onrejected);
    }

    public catch<TResult = never>(onrejected?: (reason: any) => TResult | PromiseLike<TResult>): Promise<T | TResult> {
        return this.get().catch(onrejected);
    }

    public finally(onfinally?: (() => void) | undefined | null): Promise<T> {
        return this.get().finally(onfinally);
    }

    public static resolve<T>(value: T): Future<T> {
        const future = new Future<T>();
        future.state = FutureState.Fullfilled;
        future.value = value;
        return future;
    }

    public static reject<T>(err: unknown): Future<T> {
        const future = new Future<T>();
        future.state = FutureState.Rejected;
        future.error = err;
        return future;
    }
}

export class ReadonlyFuture<T> implements Promise<T> {
    public [Symbol.toStringTag]: "ReadonlyFuture";

    public constructor(
        private future: Future<T>,
    ) {}

    public get(): Promise<T> {
        return this.future.get();
    }

    public then<TResult1 = T, TResult2 = never>(
        onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>, 
        onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
    ): Promise<TResult1 | TResult2> {
        return this.future.then(onfulfilled, onrejected);
    }

    public catch<TResult = never>(onrejected?: (reason: any) => TResult | PromiseLike<TResult>): Promise<T | TResult> {
        return this.future.catch(onrejected);
    }

    public finally(onfinally?: (() => void) | undefined | null): Promise<T> {
        return this.future.finally(onfinally);
    }
}
