"use client";

import { useEffect, useState } from "react";
import { StoreApi, UseBoundStore } from "zustand";

export const useHydratedStore = <T, F>(
	useStore: UseBoundStore<StoreApi<T>>,
	selector: (state: T) => F,
): F | undefined => {
	const result = useStore(selector);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	return isHydrated ? result : undefined;
};
