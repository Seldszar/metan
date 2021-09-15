import Emittery, { UnsubscribeFn } from "emittery";

/**
 * A message.
 */
export type Message<T = string, V = unknown> = V & {
	messageType: T;
};

/**
 * A request.
 */
export type Request<T = string, V = unknown> = {
	requestType: T;
	requestData: V;
};

/**
 * A request status.
 */
export type RequestStatus = {
	result: boolean;
	code: number;
	comment?: string;
};

/**
 * A request response.
 */
export type RequestResponse<T = string, V = unknown> = Message<
	"Response",
	{
		requestType: T;
		requestId: string;
		requestStatus: RequestStatus;
		responseData: V;
	}
>;

/**
 * A request batch result.
 */
export type RequestBatchResult = {
	requestType: string;
	requestStatus: RequestStatus;
	responseData?: unknown;
};

/**
 * A request batch response.
 */
export type RequestBatchResponse = Message<
	"RequestBatchResponse",
	{
		requestId: string;
		results: RequestBatchResult[];
	}
>;

/**
 * An event.
 */
export type Event<T = string, V = unknown> = {
	eventName: T;
	eventData: V;
};

/**
 * Connect options.
 */
export interface ConnectOptions {
	/**
	 * The address.
	 */
	address?: string;

	/**
	 * The password.
	 */
	password?: string;

	/**
	 * Ignores invalid messages.
	 */
	ignoreInvalidMessages?: boolean;

	/**
	 * Ignores non fatal request checks.
	 */
	ignoreNonFatalRequestChecks?: boolean;

	/**
	 * The event subscriptions.
	 */
	eventSubscriptions?: number;
}

/**
 * Client events.
 */
export interface ClientEvents {
	/**
	 * Called when an error occured.
	 */
	error: Error;

	/**
	 * Called when the client is connected to the server.
	 */
	connected: undefined;

	/**
	 * Called when the client is ready to use.
	 */
	ready: undefined;

	/**
	 * Called when the client has been disconnected from the server.
	 */
	disconnected: number;

	/**
	 * Called when an event has been received.
	 */
	event: Event;
}

/**
 * A client.
 */
export class Client extends Emittery<ClientEvents> {
	/**
	 * The active socket.
	 */
	socket?: WebSocket;

	/**
	 * Connects the client.
	 */
	connect(options?: ConnectOptions): void;

	/**
	 * Sends a new request.
	 *
	 * @param requestType the request type
	 */
	request<T = string, V = unknown>(
		requestType: T
	): Promise<RequestResponse<T, V>>;

	/**
	 * Sends a new request.
	 *
	 * @param requestType the request type
	 * @param requestData the request data
	 */
	request<T = string, U = unknown, V = unknown>(
		requestType: T,
		requestData: U
	): Promise<RequestResponse<T, V>>;

	/**
	 * Listen to an event.
	 *
	 * @param requestType the request type
	 * @param listener the event listener
	 */
	listen<T = string, V = unknown>(
		requestType: T,
		listener: (data: V) => void
	): UnsubscribeFn;

	/**
	 * Sends a new batch request.
	 *
	 * @param requests the requests
	 * @param haltOnFailure indicates if the requests processing will be halted on first failure
	 */
	requestBatch(
		requests: Request[],
		haltOnFailure?: boolean
	): Promise<RequestBatchResponse>;

	/**
	 * Disconnects the client.
	 */
	disconnect(): void;
}
