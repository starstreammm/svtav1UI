import type { TranscodeSettings } from "./settings";
import type { LanguageKey } from "./const";

// Image
export interface ImageInfo {
    path: string;
    size: number;
    width: number;
    height: number;
    sar: string;
    pix_fmt: string;
    color_space: string;
    color_transfer: string;
    color_primaries: string;
    zscale: string;
    sar_fix: string;
}

export interface ImageETAInfo {
    pixel_count: number[];
    cpu_used: number;
}

export interface ImageTranscodeArgs {
    crf: number;
    cpu_used: number;
}

export interface ImageTaskInfo {
    input: ImageInfo[];
    output: string;
    args: ImageTranscodeArgs;
    settings: TranscodeSettings;
}



// Video
export interface VideoInfo {
    path: string;
    size: number;
    codec: string;
    width: number;
    height: number;
    sar: string;
    pix_fmt: string;
    color_space: string;
    color_transfer: string;
    color_primaries: string;
    bit_rate: number;
    frame_rate: number;
    duration: number;
    audio_bit_rate: number;
}

export interface VideoETAInfo {
    codec: number;
    pixel_count: number;
    frame_count: number;
    subtitle: boolean;

    preset: number;
    target_bit_rate: number;
    lookahead: number;
    keyint: number;
    scd: boolean;
}

export interface VideoTranscodeArgs {
    pix_fmt: string;
    zscale: string;
    sar_fix: string;
    video_br: number;
    audio_br: number;
    rotate: number | null;
    subtitle: LanguageKey | null;
    tran: LanguageKey | null;
    tran_inmediate: boolean;
}

export interface VideoTaskInfo {
    input: VideoInfo[];
    output: string;
    args: VideoTranscodeArgs;
    settings: TranscodeSettings;
}


// LLM
export interface LLMTranslateArgs {
    original: LanguageKey;
    destination: LanguageKey;
}

export interface LLMTaskInfo {
    input: string; // Path
    output: string; // Path
    args: LLMTranslateArgs;
}
