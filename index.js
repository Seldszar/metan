const Emittery = require("emittery");
const WebSocket = require("isomorphic-ws");
const sha256 = require("simple-sha256");

const randomString = () => Math.random().toString(20).slice(2);

class RequestError extends Error {
	constructor(code, comment) {
		super(`Request returned error ${code}${comment ? ` (${comment})` : ""}`);

		this.code = code;
		this.comment = comment;

		this.name = "RequestError";

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, RequestError);
		}
	}
}

class Client extends Emittery {
	connect(options) {
		options = {
			address: "ws://localhost:4444",
			...options,
		};

		try {
			this.disconnect();
		} catch {} // eslint-disable-line no-empty

		this.socket = new WebSocket(options.address);

		this.socket.addEventListener("open", () => {
			this.emit("connected");
		});

		this.socket.addEventListener("close", (event) => {
			this.emit("disconnected", event.code);
		});

		this.socket.addEventListener("error", (event) => {
			this.emit("error", event.error);
		});

		this.socket.addEventListener("message", async (event) => {
			const data = JSON.parse(event.data.toString("utf-8"));

			switch (data.messageType) {
				case "Hello": {
					let authentication;

					if (data.authentication) {
						if (typeof options.password === "undefined") {
							throw new TypeError("Authentication Required");
						}

						const {
							authentication: { challenge, salt },
						} = data;

						const secret = await sha256(options.password + salt);
						const hash = await sha256(secret + challenge);

						authentication = hash;
					}

					this.sendMessage("Identify", {
						rpcVersion: data.rpcVersion,
						eventSubscriptions: options.eventSubscriptions,
						ignoreInvalidMessages: options.ignoreInvalidMessages,
						ignoreNonFatalRequestChecks: options.ignoreNonFatalRequestChecks,
						authentication,
					});

					break;
				}

				case "Identified": {
					this.emit("ready");

					break;
				}

				case "Event": {
					this.emit("event", data);

					break;
				}
			}

			this.emit("message", data);
		});
	}

	async request(requestType, requestData) {
		const requestId = randomString();

		this.sendMessage("Request", {
			requestType,
			requestId,
			...requestData,
		});

		const { requestStatus, responseData } = await this.waitForResponse(
			"RequestResponse",
			requestId
		);

		if (requestStatus.result) {
			return responseData;
		}

		throw new RequestError(requestStatus.code, requestStatus.comment);
	}

	async requestBatch(requests, haltOnFailure) {
		const requestId = randomString();

		this.sendMessage("RequestBatch", {
			haltOnFailure,
			requestId,
			requests,
		});

		const { requestStatus, responseData } = await this.waitForResponse(
			"RequestBatchResponse",
			requestId
		);

		if (requestStatus.result) {
			return responseData;
		}

		throw new RequestError(requestStatus.code, requestStatus.comment);
	}

	listen(eventType, listener) {
		return this.on("event", (data) => {
			if (data.eventType !== eventType) {
				return;
			}

			listener(data.eventData);
		});
	}

	disconnect() {
		if (this.socket) {
			this.socket.close();
		}

		this.socket = undefined;
	}

	sendMessage(messageType, messageData) {
		this.socket.send(JSON.stringify({ messageType, ...messageData }));
	}

	waitForResponse(messageType, requestId) {
		return new Promise((resolve) => {
			const dispose = this.on("message", (data) => {
				if (data.messageType !== messageType) {
					return;
				}

				if (data.requestId !== requestId) {
					return;
				}

				dispose(resolve(data));
			});
		});
	}
}

module.exports = {
	RequestError,
	Client,
};
