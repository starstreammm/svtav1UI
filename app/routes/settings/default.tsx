import type { TranscodeSettings, TranslatorSettings } from "~/models/settings";

export const defaultLLMConfig = {
    llm_type: "openai-api" as "openai-api" | "llama.cpp" | "mlx",
    llm_key: null,
    max_tokens: 8000,
    max_input: 330,
    prompt: [
        {
            "role": "user",
            "content": `You are a professional and accurate translator.
You will receive a multi-line text, and then tranlate it to the target language line-by-line.
The multi-line text is provided for you to understand the context only.
Do not infer or guess the meaning of the text.
Start output the translation with a line 'Singal: yyytttqqq.'.`
        }
    ],
    temperature: 0.13
};

export const defaultWhisperConfig = {
    asr_model: null,
    max_length_segment: 38,
    voice_temperature: 0,
    no_speech_threshold: 0.5,
    entropy_thold: 2.3,
    logprob_thold: -1.0,
    max_context: -1,
    suppress_nst: false,
    no_fallback: false,

    voice_speech_duration: 30,
    voice_minimum_silence_duration: 300,
    voice_threshold: 0.63,
    vad_model: null,
};

export const defaultTranslatorConfig = {
    ...defaultLLMConfig,
    ...defaultWhisperConfig,
} satisfies TranslatorSettings;



export const defaultSystemConfig = {
    overwrite: false,
    delete_source: true,
    retry: 3,
};

export const defaultTranConfig = {
    preset: 6,
    max_bitrate_mb: 88.8,
    overshoot_pct: 100,
    undershoot_pct: 10,
    maxsection_pct: 6000,
    minsection_pct: 80,
    keyint: "6s",
    lookahead: 120,
    scd: true,
    crf: 8,
    cpu_used: 3,
};

export const defaultTranscodeConfig = {
    ...defaultSystemConfig,
    ...defaultTranConfig,
} satisfies TranscodeSettings;