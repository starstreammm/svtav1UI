export interface TranscodeSettings {
    // General Settings
    overwrite: boolean;
    delete_source: boolean;
    retry: number;

    // Transcoder Settings
    preset: number;
    max_bitrate_mb: number;
    overshoot_pct: number;
    undershoot_pct: number;
    minsection_pct: number;
    maxsection_pct: number;
    keyint: string;
    lookahead: number;
    scd: boolean;

    // Image Transcoder Settings
    crf: number;
    cpu_used: number;
}

export interface WhisperSettings {
    // whisper settings
    asr_model: string | null
    voice_temperature: number
    max_length_segment: number
    no_speech_threshold: number
    entropy_thold: number
    logprob_thold: number
    max_context: number
    suppress_nst: boolean
    no_fallback: boolean

    // VAD settings
    vad_model: string | null
    voice_speech_duration: number
    voice_minimum_silence_duration: number
    voice_threshold: number
}

export interface LLMSettings {
    llm_type: "openai-api" | "llama.cpp" | "mlx"
    llm_key: string | null
    max_tokens: number
    max_input: number
    prompt: Object[]
    temperature: number
}

export interface TranslatorSettings extends WhisperSettings, LLMSettings { }

export interface TaskSchedule {
    on: boolean;
    finish_time: string;
    max_extend: number;
    sort: "longest" | "shortest" | "default";
    weight: "size" | "duration";
}

export interface ApiPath {
    dir: string[]
    file: string[]
}