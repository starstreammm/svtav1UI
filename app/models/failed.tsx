import type { ImageTaskInfo, LLMTranslateArgs, VideoTaskInfo } from "./task";
import type { LLMSettings } from "./settings";

interface FailedBase {
    uid: number;
    error: string[];
    time: string;
}

export interface VideoFailed extends VideoTaskInfo, FailedBase {
    type: "video";
}

export interface ImageFailed extends ImageTaskInfo, FailedBase {
    type: "image";
}

export interface LLMFailed extends FailedBase {
    type: "llm";
    input: string;
    output: string;
    args: LLMTranslateArgs;
    settings: LLMSettings;
}

export type ApiFailed = VideoFailed | ImageFailed | LLMFailed;