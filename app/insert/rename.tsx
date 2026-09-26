import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    Checkbox,
    Select,
    MenuItem,
    Divider,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";

import {
    useImperativeHandle,
    useRef,
    useState,
    useEffect,
    type Dispatch,
    type ForwardedRef,
    type SetStateAction,
} from "react";

import useLocalStorage from "~/hooks/storage";
import { ColumnWidth, NobarOverflow } from "~/components/frame";
import { pushMsg } from "~/components/error_popout";


const RenameType = ["Replace Text", "Regex Replace", "Add Text", "Format"] as const;
type RenameType = (typeof RenameType)[number];



export default function BatchRenameDialog({ onClose, filesName }: {
    onClose: () => void;
    filesName: () => [string, Dispatch<SetStateAction<string>>][];
}) {
    const [type, setType] = useLocalStorage<number>("renameType", 0, "local");
    const toolRef = useRef<(((orgName: string, index: number) => string) | null)[]>([null, null, null, null]);
    const [, refreshPreview] = useState(0);

    const onRename = () => {
        for (const [index, [name, setName]] of filesName().entries()) {
            setName(toolRef.current[type]?.(
                name,
                index,
            ) || name);
        };
        onClose();
    };


    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    Batch Rename
                    <Tabs
                        value={type}
                        onChange={(_, v) => setType(v)}
                        sx={{
                            "& .MuiTab-root": {
                                textTransform: "none",
                            },
                        }}
                    >
                        {RenameType.map((t, index) =>
                            <Tab label={t} value={index} />
                        )}
                    </Tabs>
                </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ display: "flex", gap: 1, height: "73vh" }}>
                <ColumnWidth width="50%">
                    <ReplaceText show={type === 0} onChange={() => refreshPreview(v => v + 1)} ref={(ref) => toolRef.current[0] = ref} />
                    <RegexReplace show={type === 1} onChange={() => refreshPreview(v => v + 1)} ref={(ref) => toolRef.current[1] = ref} />
                    <AddText show={type === 2} onChange={() => refreshPreview(v => v + 1)} ref={(ref) => toolRef.current[2] = ref} />
                    <Format show={type === 3} onChange={() => refreshPreview(v => v + 1)} ref={(ref) => toolRef.current[3] = ref} />
                </ColumnWidth>
                <Divider orientation="vertical" flexItem />
                <ColumnWidth>
                    <TableContainer component={NobarOverflow}>
                        <Table stickyHeader size="small" sx={{
                            width: "100%",
                            tableLayout: 'auto',

                            '& .no-wrap': {
                                whiteSpace: 'nowrap',
                            },

                            '& .name': {
                                width: '50%',
                                overflowWrap: 'anywhere',
                                wordBreak: 'break-word',
                            },
                        }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell align='center' className="no-wrap">Index</TableCell>
                                    <TableCell className="name">Original</TableCell>
                                    <TableCell className="name">Renamed</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filesName().map(([name, _], index) =>
                                    <TableRow key={index}>
                                        <TableCell align='center' className="no-wrap">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="name">
                                            {name}
                                        </TableCell>
                                        <TableCell className="name">
                                            {toolRef.current?.[type]?.(name, index) ?? "N/A"}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </ColumnWidth>
            </DialogContent>
            <DialogActions sx={{ p: 0 }}>
                <Box sx={{ display: "flex", justifyContent: "end", gap: 1.8, p: 1.8 }}>
                    <Button variant="outlined" onClick={onClose}>Cancel</Button>
                    <Button variant="contained" onClick={onRename}>
                        Rename
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}



function TitledItem({ title, width, children }: {
    title: string;
    width?: string | number;
    children: React.ReactNode;
}) {
    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            width: width,
            gap: 1,
        }}>
            <Typography>
                {title}:
            </Typography>
            {children}
        </Box>
    );
}


function ToolContainer({ show, children }: { show: boolean; children: React.ReactNode }) {
    return (
        <Box sx={{
            display: show ? "flex" : "none",
            flexDirection: "column",
            gap: 3,
        }}>
            {children}
        </Box>
    );
}

interface Props {
    show: boolean;
    onChange: () => void;
    ref: ForwardedRef<(orgName: string, index: number) => string>;
}

function ReplaceText({ show, onChange, ref }: Props) {
    const [originalText, setOriginalText] = useLocalStorage<string>("renameReplaceOrg", "", "local");
    const [replacementText, setReplacementText] = useLocalStorage<string>("renameReplaceDest", "", "local");
    const [maxReplace, setMaxReplace] = useLocalStorage<number>("renameReplaceMax", -1, "local");

    function replaceLimit(
        text: string,
        search: string,
        replacement: string,
        limit: number,
    ) {
        if (limit <= 0 || !search) return text;

        let count = 0;

        return text.replaceAll(search, (match) => {
            if (count >= limit) {
                return match;
            }

            count++;
            return replacement;
        });
    }

    useImperativeHandle(ref, () => (orgName: string, index: number) => {
        if (typeof maxReplace === "number" && maxReplace > 0)
            return replaceLimit(orgName, originalText, replacementText, maxReplace);
        else
            return (orgName ?? "").replaceAll(originalText, replacementText);
    });

    useEffect(() => {
        onChange();
    }, [originalText, replacementText, maxReplace]);


    return (
        <ToolContainer show={show}>
            {([
                ["Original Text", originalText, setOriginalText],
                ["Replacement Text", replacementText, setReplacementText],
                ["Max Replace (-1 for unlimited)", maxReplace.toString(), setMaxReplace],
            ] as [string, string, Dispatch<SetStateAction<string>>][]).map(([label, value, setValue]) =>
                <TitledItem title={label} key={label}>
                    <TextField
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </TitledItem>
            )}
        </ToolContainer>
    );
}



function RegexReplace({ show, onChange, ref }: Props) {
    const [pattern, setPattern] = useLocalStorage<string>("renameRegexPattern", "", "local");
    const [replacement, setReplacement] = useLocalStorage<string>("renameRegexReplacement", "", "local");

    useImperativeHandle(ref, () => (orgName: string, index: number) => {
        try {
            const regex = new RegExp(pattern, "g");
            return (orgName ?? "").replace(regex, replacement);
        }
        catch (error) {
            pushMsg(`Invalid regex pattern: ${error}`, "error");
            throw new Error(`Invalid regex pattern: ${error}`);
        }
    });

    useEffect(() => {
        onChange();
    }, [pattern, replacement]);


    return (
        <ToolContainer show={show}>
            {([
                ["Regex Pattern", pattern, setPattern],
                ["Replacement Text", replacement, setReplacement],
            ] as [string, string, Dispatch<SetStateAction<string>>][]).map(([label, value, setValue]) =>
                <TitledItem title={label} key={label}>
                    <TextField
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </TitledItem>
            )}
        </ToolContainer>
    );
}

function AddText({ show, onChange, ref }: Props) {
    const whereKeys = ["before name", "after name"] as const;
    const [where, setWhere] = useLocalStorage<typeof whereKeys[number]>("renameAddTextWhere", "before name", "local");
    const [text, setText] = useLocalStorage<string>("renameAddText", "", "local");

    useImperativeHandle(ref, () => (orgName: string, index: number) => {
        if (where === "before name") {
            return text + orgName;
        }
        else {
            return orgName + text;
        }
    });

    useEffect(() => {
        onChange();
    }, [where, text]);


    return (
        <ToolContainer show={show}>
            <TitledItem title="Where">
                <Select
                    value={where}
                    onChange={(e) => setWhere(e.target.value as typeof whereKeys[number])}
                >
                    {whereKeys.map((key) =>
                        <MenuItem key={key} value={key}>{key}</MenuItem>
                    )}
                </Select>
            </TitledItem>
            <TitledItem title="Add Text">
                <TextField
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </TitledItem>
        </ToolContainer>
    );
}

function Format({ show, onChange, ref }: Props) {
    const whereKeys = ["before", "after"] as const;
    const [where, setWhere] = useLocalStorage<typeof whereKeys[number]>("renameFormatWhere", "after", "local");
    const formatKeys = ["Name and Index", "Name and Counter"] as const;
    const [format, setFormat] = useLocalStorage<typeof formatKeys[number]>("renameFormatType", "Name and Index", "local");
    const [useCustomText, setUseCustomText] = useLocalStorage<boolean>("renameFormatUseCustomText", true, "local");
    const [customText, setCustomText] = useLocalStorage<string>("renameFormatCustomText", "OutputFile", "local");
    const [startNumber, setStartNumber] = useState("1");

    const isNumber = (num: string) => {
        return num.trim() !== "" && Number.isFinite(Number(num));
    };


    useImperativeHandle(ref, () => (orgName: string, index: number) => {
        if (!isNumber(startNumber)) {
            pushMsg("Invalid start number: Start number must be a non-negative integer", "error");
            throw new Error("Invalid start number: Start number must be a non-negative integer");
        }
        const start = Number(startNumber);
        const text = useCustomText ? customText : orgName;

        if (format === "Name and Index") {
            return where === "before"
                ? `${start + index}${text}`
                : `${text}${start + index}`;
        }
        else {
            const length = startNumber.length;
            return where === "before"
                ? `${(start + index).toString().padStart(length, "0")}${text}`
                : `${text}${(start + index).toString().padStart(length, "0")}`;
        }
    });

    useEffect(() => {
        onChange();
    }, [where, format, customText, startNumber, useCustomText]);

    useEffect(() => {
        if (format === "Name and Counter")
            setStartNumber("001");
        else
            setStartNumber("1");
    }, [format]);


    return (
        <ToolContainer show={show}>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                <TitledItem title="Where" width="50%">
                    <Select
                        value={where}
                        onChange={(e) => setWhere(e.target.value as typeof whereKeys[number])}
                        sx={{ width: "50%" }}
                    >
                        {whereKeys.map((key) =>
                            <MenuItem key={key} value={key}>{key}</MenuItem>
                        )}
                    </Select>
                </TitledItem>
                <TitledItem title="Name Format" width="50%">
                    <Select
                        value={format}
                        onChange={(e) => setFormat(e.target.value as typeof formatKeys[number])}
                        fullWidth
                    >
                        {formatKeys.map((key) =>
                            <MenuItem key={key} value={key}>{key}</MenuItem>
                        )}
                    </Select>
                </TitledItem>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <Checkbox
                    checked={useCustomText}
                    onChange={(e) => setUseCustomText(e.target.checked)}
                />
                <Typography sx={{ whiteSpace: "nowrap", mr: 3 }}>
                    Custom Text:
                </Typography>
                <TextField
                    disabled={!useCustomText}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    fullWidth
                />
            </Box>
            <TitledItem title="Start Numbers at">
                <TextField
                    value={startNumber}
                    onChange={(e) => {
                        if (isNumber(e.target.value)) {
                            setStartNumber(e.target.value);
                        }
                    }}
                />
            </TitledItem>
        </ToolContainer>
    );
}