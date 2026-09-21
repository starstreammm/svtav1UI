import type { VideoInfo, VideoTranscodeArgs } from "~/models/task";
import { type LanguageKey } from "~/models/const";


export interface VideoInsertConfig {
    priority: boolean;

    allow_av1: boolean;
    multi_in_one: boolean;
    only_subtitle: boolean;

    rotate: number | null;
    subtitle: LanguageKey | null | undefined;
    tran: LanguageKey | null;
    tran_inmediate: boolean;
}

export interface VideoResponse {
    info: VideoInfo;
    args: VideoTranscodeArgs;
}

export interface ImageInsertConfig {
    priority: boolean;
}

export type LLMResponse = [string, LanguageKey];