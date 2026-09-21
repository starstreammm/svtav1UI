import type { LanguageKey } from "./const";
import type { WhisperSettings } from "./settings";
import type { ImageInfo, ImageTaskInfo, LLMTranslateArgs, VideoTaskInfo } from "./task";

interface BaseRunning {
    start_time: string; // datetime
    consumed_time: string; // timedelta
    cpu_usage: number;
    ram_usage: number;
}


export interface AudioRunning extends BaseRunning {
    // Identifier
    type: "audio";

    // Task Info
    input: string[]; // Path
    output: string; // Path
    total_duration: string; // timedelta

    // Progress Info
    bitrate: string;
    size: string;
    completed_duration: string; // timedelta
    dup_frames: number;
    drop_frames: number;
    speed: number;
    progress: number;
    eta: string; // timedelta
}

export interface VideoRunning extends VideoTaskInfo, BaseRunning {
    // Identifier
    type: "video";

    // Task Info
    uid: number;
    total_duration: string; // timedelta
    retry: number;

    // Progress Info
    frame: number;
    fps: number;
    qp: number;
    bitrate: string;
    size: string;
    completed_duration: string; // timedelta
    dup_frames: number;
    drop_frames: number;
    speed: number;
    progress: number;
    eta: string; // timedelta
}

export interface ImageRunningItem extends ImageInfo {
    start_time: string; // datetime
}

export interface ImageErrorItem extends ImageInfo {
    error: string;
}

export interface ImageCompletedItem {
    input: ImageInfo;
    output: ImageInfo;
    consumed_time: string; // timedelta
}

export interface ImageRunning extends BaseRunning {
    // Identifier
    type: "image";

    // Task Info
    uid: number;
    output: string; // Path
    args: ImageTaskInfo["args"];
    settings: ImageTaskInfo["settings"];

    // Progress Info
    pending: ImageInfo[];
    completed: ImageCompletedItem[];
    running: ImageRunningItem[];
    error: ImageErrorItem[];
}


export interface WhisperRunning extends BaseRunning {
    // Identifier
    type: "whisper";

    // Task Info
    input: string; // Path
    output: string; // Path
    subtitle: LanguageKey;
    settings: WhisperSettings

    // Progress Info
    progress: number;
    log: string[];
}

export interface LLMRunning extends BaseRunning {
    // Identifier
    type: "llm";

    // Task Info
    uid: number;
    input: string; // Path
    output: string; // Path
    args: LLMTranslateArgs;

    // Progress Info
    progress: number;
    log: string[];
}

export type ApiRunning = AudioRunning | VideoRunning | ImageRunning | WhisperRunning | LLMRunning;