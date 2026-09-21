import {
    Autocomplete,
    TextField,
    Typography,
    IconButton,
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import CreateNewFolderRoundedIcon from '@mui/icons-material/CreateNewFolderRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import { useEffect, useMemo, useState } from "react";

import type { ApiPath } from "~/models/settings";
import { api } from "~/hooks/api";
import { getLocalStorage } from "~/hooks/storage";
import { pushMsg, pushError } from "~/components/error_popout";

const apiUrl = getLocalStorage("apiUrl", "local");


export default function PathSelector({
    label,
    onClose,
    onEnter,
    type = "any",
    filter = "video",
    value,
    addDir
}: {
    label: string;
    onClose: (path: string) => void;
    onEnter?: (path: string) => void;
    type?: "file" | "dir" | "any";
    filter?: "video" | "image" | "subtitle" | "model";
    value?: string | null;
    addDir?: boolean
}) {
    const [path, setPath] = useState("/");
    const [pathList, setPathList] = useState<ApiPath>({ dir: [], file: [] });
    const [newFolder, setNewFolder] = useState<string | null>(null);


    const backPath = (path: string) => {
        if (path === "/") return "/";
        if (path.endsWith("/")) path = path.slice(0, -1);
        return path.split('/').slice(0, -1).join('/') + "/" || "/";
    };

    const standardizePath = async (path: string) => {
        if (path.startsWith('"') && path.endsWith('"')) path = path.slice(1, -1);
        if (path.startsWith("'") && path.endsWith("'")) path = path.slice(1, -1);
        if (path === "") return "/";
        path = path.replaceAll("//", "/");
        if (!path.startsWith("/")) path = "/" + path;
        try {
            const isFile = await checkFile(path);
            if (isFile) {
                return path;
            }
            else {
                if (!path.endsWith("/")) { return path + "/"; }
                else { return path; }
            }
        }
        catch { return path.slice(0, path.lastIndexOf("/") + 1); };
    };

    const fetch = (path: string) => {
        fetchPathList(path, filter)
            .then(data => setPathList(data))
    };

    const fetch_home = async () => {
        try {
            let home = await api.get(`${apiUrl}/path/home`).json<string>();
            if (home.startsWith("\"") && home.endsWith("\"")) {
                home = home.slice(1, -1);
            }
            return home.endsWith("/") ? home : home + "/";
        }
        catch (error) { pushError(error, "Fetch home path"); return "/"; }
    };

    const makeDir = () => {
        api.get(`${apiUrl}/path/mkdir`, { searchParams: { path: path + newFolder } })
            .then(() => {
                setPath(prev => prev + newFolder + "/");
                setNewFolder(null);
            })
            .catch(error => {
                pushError(error, "Create new folder");
            })
    };

    const close_check = async (is_enter: boolean) => {
        try {
            // Check if the path is valid
            const type_check = await checkFile(path);

            if (type === "any") {
                let res = path;
                if (!type_check)
                    res = path.endsWith("/") ? path : path + "/";
                handleClose(res, is_enter);
            }
            else if (type === "file") {
                if (type_check) { handleClose(path, is_enter); }
                else { pushMsg("The path you entered is a directory. Please select a file", "error"); }
            }
            else if (type === "dir") {
                if (!type_check) { handleClose(path, is_enter); }
                else { pushMsg("The path you entered is a file. Please select a directory", "error"); }
            }
        }
        catch (error) { return; }
    }

    const handleClose = (res: string, is_enter: boolean) => {
        if (is_enter && onEnter) { onEnter(res); }
        else { onClose(res); }
    }

    const fetch_options = useMemo(() => {
        const prepath = path.slice(0, path.lastIndexOf("/") + 1);
        const prefix = path.slice(path.lastIndexOf("/") + 1);

        return [
            ...pathList.dir
                .filter((dir) => dir.startsWith(prefix))
                .map((dir) => prepath + dir + "/"),
            ...(type === "dir"
                ? []
                : pathList.file
                    .filter((file) => file.startsWith(prefix))
                    .map((file) => prepath + file)
            )
        ]
    }, [path, pathList, type]);

    useEffect(() => {
        if (value === path) return;
        else if (typeof value === "string") { Promise.resolve(standardizePath(value)).then(setPath); }
        else { fetch_home().then((home) => { setPath(home); }); }
    }, [, value]);

    return (
        <>
            <Dialog
                fullWidth
                open={newFolder !== null}
                onClose={() => setNewFolder(null)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        e.stopPropagation();
                        setNewFolder(null);
                    }
                    if (e.key === "Enter") {
                        e.stopPropagation();
                        onClose(path + newFolder + "/");
                        makeDir();
                    }
                }}
            >
                <DialogTitle>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        Create New Folder
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Folder Name"
                        variant="outlined"
                        value={newFolder}
                        sx={{ mt: 1, width: "100%" }}
                        onChange={(e) => setNewFolder(e.target.value.replaceAll("/", "").replaceAll("&", "_"))}
                    />
                </DialogContent>
                <DialogActions sx={{ pb: 3, pr: 3, gap: 1 }}>
                    <Button onClick={() => setNewFolder(null)} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            onClose(path + newFolder + "/");
                            makeDir();
                        }}
                        disabled={newFolder === null || newFolder === ""}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
            <Box sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 1,
            }}>
                <IconButton
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        setPath(backPath(path));
                        fetch(backPath(path));
                        onClose(backPath(path));
                    }}
                >
                    <ArrowBackRoundedIcon color="primary" />
                </IconButton>
                <Autocomplete
                    disableCloseOnSelect
                    disablePortal
                    value={path}
                    onOpen={() => fetch(path)}
                    onClose={() => close_check(false)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            close_check(true);
                        }
                    }}
                    options={fetch_options}
                    sx={{ width: "100%" }}
                    onInputChange={async (_, value, reason) => {
                        if (reason === "selectOption") {
                            setPath(value);
                            fetch(value);
                        }
                        else {

                            if (value.startsWith(path.slice(0, path.lastIndexOf("/") + 1))) {
                                setPath(value);
                                fetch(value.slice(0, value.lastIndexOf("/") + 1));
                            }
                            else {
                                const newPath = await standardizePath(value);
                                setPath(newPath);
                                fetch(newPath);
                            }
                        }
                    }}
                    renderInput={(params) => <TextField
                        {...params}
                        multiline
                        label={label}
                        variant="outlined"
                    />}
                />
                {addDir &&
                    <IconButton onClick={() => setNewFolder("")}>
                        <CreateNewFolderRoundedIcon color="primary" />
                    </IconButton>
                }
            </Box>
        </>
    );
}

export async function fetchPathList(path: string, filter: "video" | "image" | "subtitle" | "model") {
    try {
        const res = await api.get(`${apiUrl}/path/ls`, { searchParams: { path, filter } }).json<ApiPath>();
        return res;
    }
    catch (error) {
        pushError(error, "Fetch file list");
        throw error;
    }
}


export async function checkFile(path: string) {
    try {
        const res = await api.get(`${apiUrl}/path/is_file`, { searchParams: { path } }).json<boolean>();
        return res;
    }
    catch (error) {
        pushError(error, "Check is file");
        throw error;
    }
}
