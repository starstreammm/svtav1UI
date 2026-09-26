import type { VideoInfo, VideoTaskInfo, VideoTranscodeArgs } from "~/models/task";
import type { VideoResponse } from "../models";
import { getLocalStorage } from "~/hooks/storage";
import { api } from "~/hooks/api";
import { pushError } from "~/components/error_popout";

const apiUrl = getLocalStorage("apiUrl", "local");


export async function submitTask(task: VideoTaskInfo, priority: boolean) {
    try {
        await api.post(`${apiUrl}/task/submit`, { json: task, searchParams: { priority: priority } });
    }
    catch (error) {
        pushError(error, "Submit task");
        throw error;
    }
}

export async function fetchTaskInfo(path: string): Promise<VideoResponse> {
    try {
        const res = await api.get(`${apiUrl}/task/spawn`, {
            searchParams: { path: path },
        }).json<VideoResponse>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch task info");
        throw error;
    }
}

export async function fetchBatchTaskInfo(path: string): Promise<VideoResponse[]> {
    try {
        const res = await api.get(`${apiUrl}/task/spawn/batch`, {
            searchParams: { path, type: "video" },
            timeout: 18 * 60 * 1000, // 18 minutes
        }).json<VideoResponse[]>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch batch task info");
        throw error;
    }
}


export async function fetchMultiTaskInfo(files: VideoInfo[]): Promise<VideoTranscodeArgs> {
    try {
        const res = await api.post(`${apiUrl}/task/spwan/multi`, { json: files }).json<VideoTranscodeArgs>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch multi task info");
        throw error;
    }
}
