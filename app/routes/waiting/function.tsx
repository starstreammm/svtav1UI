import type { ApiWaiting, LLMWaiting } from "~/models/waiting";
import { api } from "~/hooks/api";
import { getLocalStorage } from "~/hooks/storage";
import { pushError } from "~/components/error_popout";
const apiUrl = getLocalStorage("apiUrl", "local");

export interface ApiSort {
    uid: number
    last?: number
    next?: number
}



export function throttle<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let canRun = true;

    return (...args: Parameters<T>) => {
        if (!canRun) return;

        canRun = false;
        fn(...args);

        setTimeout(() => {
            canRun = true;
        }, delay);
    };
}

export async function fetchWaitingList() {
    try {
        const res = await api.get(`${apiUrl}/task/waiting`).json<ApiWaiting[]>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch waiting tasks");
        throw error;
    }
}

export async function fetchLLMWaitingList() {
    try {
        const res = await api.get(`${apiUrl}/task/waiting/llm`).json<LLMWaiting[]>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch LLM waiting tasks");
        throw error;
    }
}

export async function resortWaitingItem(sort: ApiSort) {
    try {
        await api.post(`${apiUrl}/task/waiting/sort`, { json: sort });
    }
    catch (error) {
        pushError(error, "Resort waiting tasks");
        throw error;
    }
}

export async function deleteWaitingItem(uid: number) {
    try {
        await api.post(`${apiUrl}/task/waiting/delete`, { searchParams: { uid } });
    }
    catch (error) {
        pushError(error, `Delete task ${uid}`);
        throw error;
    }
}

export async function deleteLLMWaitingItem(uid: number) {
    try {
        await api.post(`${apiUrl}/task/waiting/llm/delete`, { searchParams: { uid } });
    }
    catch (error) {
        pushError(error, `Delete LLM task ${uid}`);
        throw error;
    }
}
