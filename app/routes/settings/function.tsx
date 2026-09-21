import type { TranscodeSettings, TranslatorSettings } from "~/models/settings";
import { api } from "~/hooks/api";
import { getLocalStorage } from "~/hooks/storage";
import { pushError } from "~/components/error_popout";


const apiUrl = getLocalStorage("apiUrl", "local");


export async function fetchTranscodeSettings(): Promise<TranscodeSettings> {
    try {
        const res = await api.get(`${apiUrl}/settings/transcode`).json<TranscodeSettings>()
        return res;
    }
    catch (error) {
        pushError(error, "Fetch Transcode settings");
        throw error;
    }
}


export async function fetchTranslatorSettings(): Promise<TranslatorSettings> {
    try {
        const res = await api.get(`${apiUrl}/settings/translator`).json<TranslatorSettings>()
        return res;
    }
    catch (error) {
        pushError(error, "Fetch Translator settings");
        throw error;
    }
}


export async function updateTranscodeSettings(settings: TranscodeSettings): Promise<TranscodeSettings> {
    try {
        const res = await api.post(`${apiUrl}/settings/transcode`, { json: settings }).json<TranscodeSettings>()
        return res;
    }
    catch (error) {
        pushError(error, "Update Transcode settings");
        throw error;
    }
}


export async function updateTranslatorSettings(settings: TranslatorSettings): Promise<TranslatorSettings> {
    try {
        const res = await api.post(`${apiUrl}/settings/translator`, { json: settings }).json<TranslatorSettings>()
        return res;
    }
    catch (error) {
        pushError(error, "Update Translator settings");
        throw error;
    }
}

export async function checkLLM() {
    try {
        const res = await api.get(`${apiUrl}/settings/check/translator`).json<boolean>();
        return res;
    }
    catch (error) {
        pushError(error, "Check LLM");
        throw error;
    }
}

export async function fetchBackendVersion(): Promise<string> {
    try {
        const res = await api.get(`${apiUrl}/settings/version`).json<string>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch backend version");
        throw error;
    }
}