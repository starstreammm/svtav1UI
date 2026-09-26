import type { ImageInfo, ImageTaskInfo } from "~/models/task";
import { getLocalStorage } from "~/hooks/storage";
import { api } from "~/hooks/api";
import { pushError } from "~/components/error_popout";

const apiUrl = getLocalStorage("apiUrl", "local");


export async function submitTask(task: ImageTaskInfo, priority: boolean) {
    try {
        await api.post(`${apiUrl}/task/submit`, { json: task, searchParams: { priority: priority } });
    }
    catch (error) {
        pushError(error, "Submit task");
        throw error;
    }
}

export async function fetchTaskInfo(path: string): Promise<ImageInfo> {
    try {
        const res = await api.get(`${apiUrl}/task/spawn`, {
            searchParams: { path: path },
            timeout: 18 * 60 * 1000, // 18 minutes
        }).json<ImageInfo>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch task info");
        throw error;
    }
}

export async function fetchBatchTaskInfo(path: string): Promise<ImageInfo[]> {
    try {
        const res = await api.get(`${apiUrl}/task/spawn/batch`, {
            searchParams: { path, type: "image" },
            timeout: 18 * 60 * 1000, // 18 minutes
        }).json<ImageInfo[]>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch batch task info");
        throw error;
    }
}