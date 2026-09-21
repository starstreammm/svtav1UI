import { Select, MenuItem } from "@mui/material";
import { Language, Rotate, type LanguageKey } from "~/models/const";


export function RotateSelector({ value, onChange }: {
    value: number | null;
    onChange: (value: number | null) => void;
}) {
    return (
        <Select
            value={value ?? "null"}
            onChange={(e) => {
                onChange(e.target.value === "null" ? null : Number(e.target.value));
            }}
            sx={{ width: 188 }}
            displayEmpty
        >
            <MenuItem value="null">None</MenuItem>
            {Rotate.map((option, index) => (
                <MenuItem key={option} value={index}>
                    {option}
                </MenuItem>
            ))}
        </Select>
    );
}


export function OrgLangSelector({ value, onChange }: {
    value: LanguageKey | null | undefined;
    onChange: (value: LanguageKey | null) => void;
}) {
    return (
        <Select
            value={value ?? "null"}
            onChange={(e) => {
                onChange(e.target.value === "null" ? null : e.target.value);
            }}
            displayEmpty
            sx={{ width: 138, ml: 1 }}
        >
            <MenuItem value={"null"}>None</MenuItem>
            {Object.entries(Language)
                .filter(([key]) => key !== "zh-CN" && key !== "zh-TW")
                .map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                        {value}
                    </MenuItem>
                ))
            }
        </Select>
    );
}


export function DestLangSelector({ org, value, onChange }: {
    org: LanguageKey | null | undefined;
    value: LanguageKey | null | undefined;
    onChange: (value: LanguageKey | null) => void;
}) {
    return (
        <Select
            value={value ?? "null"}
            onChange={(e) => {
                onChange(e.target.value === "null" ? null : e.target.value);
            }}
            displayEmpty
            sx={{ width: 138, ml: 1 }}
            disabled={!org}
        >
            <MenuItem value={"null"}>None</MenuItem>
            {Object.entries(Language)
                .filter(([key]) => (
                    key !== org
                    && key !== "zh"
                    && !(
                        org === "zh"
                        && (key === "zh-CN" || key === "zh-TW")
                    )
                )).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                        {value}
                    </MenuItem>
                ))
            }
        </Select>
    );
}