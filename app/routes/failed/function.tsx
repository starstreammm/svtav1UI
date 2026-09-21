import type { ApiFailed } from "~/models/failed";
import { api } from "~/hooks/api";
import { getLocalStorage } from "~/hooks/storage";
import { pushError } from "~/components/error_popout";

const apiUrl = getLocalStorage("apiUrl", "local");



export async function fetchFailedTasks(): Promise<ApiFailed[]> {
    try {
        const res = await api.get(`${apiUrl}/task/failed`).json<ApiFailed[]>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch failed tasks");
        throw error;
    }
}

export async function deleteFailedTask(uid: number) {
    try {
        await api.post(`${apiUrl}/task/failed/delete`, { searchParams: { uid } });
    }
    catch (error) {
        pushError(error, "Delete failed task");
        throw error;
    }
}

export async function clearFailedList() {
    try {
        await api.post(`${apiUrl}/task/failed/clear`);
    }
    catch (error) {
        pushError(error, "Clear failed tasks");
        throw error;
    }
}