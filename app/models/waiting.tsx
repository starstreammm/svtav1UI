import type { ImageETAInfo, ImageTaskInfo, VideoETAInfo, VideoTaskInfo, LLMTaskInfo } from "./task";


interface WaitingBase {
    uid: number;
    sort: number;
    retry: number;
    error: string[];
}

export interface ImageWaiting extends WaitingBase, ImageTaskInfo {
    type: "image";
    eta: ImageETAInfo;
}

export interface VideoWaiting extends WaitingBase, VideoTaskInfo {
    type: "video";
    eta: VideoETAInfo;
}

export interface LLMWaiting extends LLMTaskInfo {
    uid: number;
}


export type ApiWaiting = ImageWaiting | VideoWaiting;