import { io, Socket } from "socket.io-client";
import { create } from "zustand";

export interface SocketState {
	socket?: Socket;
	isConnected: boolean;
	isConnecting: boolean;
	disconnectReason?: string;

	connect: () => void;
	disconnect: () => void;
	isSocketReady: () => boolean;
}

export const useSocketStore = create<SocketState>((set, get) => ({
	socket: undefined,
	isConnected: false,
	isConnecting: false,
	disconnectReason: undefined,

	connect: () => {
		const { socket, isConnected, isConnecting } = get();

		if (socket || isConnected || isConnecting) return;

		set({ isConnecting: true });

		const newSocket = io("http://localhost:8000", {
			transports: ["websocket"],
		});

		console.log("connecting to the server");

		newSocket.on("connect", async () => {
			console.log("connected to the server");
			set({
				socket: newSocket,
				isConnected: true,
				isConnecting: false,
			});
		});

		newSocket.on("connect_error", (error) => {
			console.warn(error);
			set({ isConnected: false, isConnecting: false });
		});

		newSocket.on("disconnect", (reason) => {
			if (reason === "io server disconnect") {
				setTimeout(() => newSocket.connect(), 5000);
				return;
			}
			set({
				socket: undefined,
				isConnected: false,
				disconnectReason: reason,
			});
		});

		newSocket.on("exception", (error) => {
			console.error(error);
		});
	},

	disconnect: () => {
		const { socket, isConnected, isConnecting } = get();

		if (!isConnected || isConnecting || !socket) return;

		socket.disconnect();
	},

	isSocketReady: () => {
		const { socket, isConnected, isConnecting } = get();

		if (!socket || !isConnected || isConnecting) return false;

		return true;
	},
}));
