import type { LLMTaskInfo } from '~/models/task';
import { type LanguageKey, Language } from '~/models/const';
import { api } from "~/hooks/api";
import { getLocalStorage } from "~/hooks/storage";
import { pushError } from "~/components/error_popout";

const apiUrl = getLocalStorage("apiUrl", "local");


export function getOriginalLanguage(path: string): LanguageKey {
    const match = path.match(/\.([^\.]+)\.srt$/);
    if (match && match[1] in Language) {
        return match[1] as LanguageKey;
    }
    return "en";
}

export function getOutputPath(path: string, destinationLanguage: LanguageKey): string {
    const name = path.slice(0, path.lastIndexOf("."));
    const index = name.lastIndexOf(".");
    const stat = name.slice(0, index === -1 ? undefined : index);
    return `${stat}.${destinationLanguage}.srt`;
}

export async function submitTask(task: LLMTaskInfo) {
    try {
        await api.post(`${apiUrl}/task/submit/llm`, { json: task });
    }
    catch (error) {
        pushError(error, "Submit task");
        throw error;
    }
}