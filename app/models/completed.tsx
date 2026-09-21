import type { ImageInfo, ImageTranscodeArgs, LLMTranslateArgs, VideoInfo, VideoTranscodeArgs } from "./task";
import type { LanguageKey } from "./const";


export interface VideoCompleted {
    type: "video";
    input: VideoInfo[];
    output: VideoInfo;
    args: VideoTranscodeArgs;
    total_consumed: string;
    finished_time: string;
}

export interface ImageCompleted {
    type: "image";
    input: ImageInfo[];
    output: ImageInfo[];
    args: ImageTranscodeArgs;
    total_consumed: string;
    finished_time: string;
}

export interface WhisperCompleted {
    type: "whisper";
    input: string[];
    output: string;
    args: LanguageKey;
    total_consumed: string;
    finished_time: string;
}

export interface LLMCompleted {
    type: "llm";
    input: string;
    output: string;
    args: LLMTranslateArgs;
    total_consumed: string;
    finished_time: string;
}

export type ApiCompleted = VideoCompleted | ImageCompleted | WhisperCompleted | LLMCompleted;