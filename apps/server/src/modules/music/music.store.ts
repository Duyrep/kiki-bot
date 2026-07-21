import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { MusicEvents } from "@rep/shared/events";

export interface ViewerOrder {
	id: string;
	videoId: string;
	viewerName: string;
	createdAt: number;
}

@Injectable()
export class MusicStore {
	constructor(private readonly eventEmitter: EventEmitter2) {}
	private viewerOrders: ViewerOrder[] = [];

	public addOrder(order: ViewerOrder) {
		this.viewerOrders.push(order);
		this.eventEmitter.emit(MusicEvents.ORDER_ADDED, order);
	}

	public removeOrder(orderId: string) {
		const index = this.viewerOrders.findIndex((item) => item.id === orderId);

		if (index !== -1) {
			const [removedOrder] = this.viewerOrders.splice(index, 1);
			this.eventEmitter.emit(MusicEvents.ORDER_REMOVED, removedOrder);
			return removedOrder;
		}

		return undefined;
	}

	public getOrder() {
		return this.viewerOrders;
	}

	public getOrderLength() {
		return this.viewerOrders.length;
	}
}
