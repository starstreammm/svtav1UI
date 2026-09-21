import type { ApiCompleted } from "~/models/completed";
import { api } from "~/hooks/api";
import { getLocalStorage } from "~/hooks/storage";
import { pushError } from "~/components/error_popout";

const apiUrl = getLocalStorage("apiUrl", "local");


export async function fetchCompletedList() {
    try {
        const res = await api.get(`${apiUrl}/task/completed`).json<ApiCompleted[]>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch completed tasks");
        throw error;
    }
}

export async function clearCompletedList() {
    try {
        await api.post(`${apiUrl}/task/completed/clear`);
    }
    catch (error) {
        pushError(error, "Clear completed tasks");
        throw error;
    }
}
