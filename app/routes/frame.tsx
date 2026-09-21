import {
    Box,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemButton,
    ListItemText,
    ListSubheader,
} from "@mui/material";
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import PauseCircleOutlineRoundedIcon from '@mui/icons-material/PauseCircleOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';

import { useNavigate, Outlet, useLocation } from "react-router";

import { useState } from "react";

import AppBarComponent from "~/components/appbar";
import VideoInsert from "~/insert/video";
import ImageInsert from "~/insert/image";
import LLMInsert from "~/insert/llm";

const drawerWidth = 218;

export default function Home() {
    const location = useLocation();
    const navigate = useNavigate();

    const [insertOpen, setInsertOpen] = useState<number>(-1);

    return (
        <>
            {insertOpen === 0 &&
                <VideoInsert
                    onClose={() => setInsertOpen(-1)}
                    onCancel={() => setInsertOpen(-1)}
                />
            }
            {insertOpen === 1 &&
                <ImageInsert
                    onClose={() => setInsertOpen(-1)}
                    onCancel={() => setInsertOpen(-1)}
                />
            }
            {insertOpen === 2 &&
                <LLMInsert
                    onClose={() => setInsertOpen(-1)}
                    onCancel={() => setInsertOpen(-1)}
                />
            }
            <AppBarComponent />
            <Box sx={{
                position: "absolute",
                top: 68,
                left: 0,
                right: 0,
                bottom: 0,
                height: 'calc(100vh - 68px)',
                width: '100vw',
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                backgroundColor: (theme) => theme.vars?.palette.background.default,
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    width: drawerWidth,
                    height: "100%",
                    flexShrink: 0,
                    flexGrow: 0,
                    p: 0,
                    m: 0,
                    overflowY: 'auto',
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": {
                        display: "none",
                    },
                }}>
                    {Object.entries({
                        "Queue": [
                            ['Running', "/running", <PlayCircleOutlineRoundedIcon />],
                            ['Waiting', "/waiting", <PauseCircleOutlineRoundedIcon />],
                            ['LLM Waiting', "/llm-waiting", <PauseCircleOutlineRoundedIcon />],
                            ['Completed', "/completed", <CheckCircleRoundedIcon />],
                            ['Failed', "/failed", <CancelOutlinedIcon />],
                        ],
                        "Settings": [
                            ['System Settings', "/sys_settings", <TuneRoundedIcon />],
                            ['Transcoder Settings', "/tran_settings", <TuneRoundedIcon />],
                            ['Whisper Settings', "/whisper_settings", <SettingsRoundedIcon />],
                            ['LLM Settings', "/llm_settings", <SettingsRoundedIcon />],
                        ],
                    } as Record<string, [string, string, React.ReactNode][]>)
                        .map(([subheader, items]) => (
                            <List
                                key={subheader}
                                sx={{ py: 0, width: "100%" }}
                                subheader={
                                    <ListSubheader>
                                        {subheader}
                                    </ListSubheader>
                                }
                            >
                                {items.map(([text, path, icon]) => (
                                    <ListItemButton
                                        key={text}
                                        selected={location.pathname === path}
                                        onClick={() => navigate(path)}
                                    >
                                        <ListItemIcon>{icon}</ListItemIcon>
                                        <ListItemText primary={text} />
                                    </ListItemButton>
                                ))}
                            </List>
                        ))}
                    <List
                        sx={{ p: 0, m: 0, width: "100%" }}
                        subheader={
                            <ListSubheader>
                                Add Task
                            </ListSubheader>
                        }
                    >
                        {["Video", "Image", "LLM"].map((text, index) =>
                            <ListItem disablePadding key={text}>
                                <ListItemButton onClick={() => setInsertOpen(index)}>
                                    <ListItemIcon>
                                        <AddCircleRoundedIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={`Insert ${text} Task`} />
                                </ListItemButton>
                            </ListItem>
                        )}
                    </List>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    width: `calc(100vw - ${drawerWidth}px)`,
                    height: `calc(100vh - 68px)`,
                    overflowY: 'auto',
                }}>
                    <Outlet />
                </Box>
            </Box>
        </>
    );
}
