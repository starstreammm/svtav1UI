import {
    Button,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Checkbox,
} from "@mui/material";

import { useState, type Dispatch, type SetStateAction } from "react";

import type { ImageInfo } from "~/models/task";
import { RotateSelector } from "~/components/select";




export default function RotateImageDialog({ onClose, images, setImages }: {
    onClose: () => void;
    images: ImageInfo[];
    setImages: Dispatch<SetStateAction<ImageInfo[]>>;
}) {
    const [selectAll, setSelectAll] = useState(false);
    const [rotates, setRotates] = useState<[number | null, boolean][]>(images.map(image => [image.rotate, false]));


    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>
                Rotate Images
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <TableContainer>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <Checkbox
                                        checked={selectAll}
                                        onChange={(e) => {
                                            setSelectAll(e.target.checked);
                                            setRotates(rotates.map(([rotate, _]) => [rotate, e.target.checked]));
                                        }}
                                    />
                                </TableCell>
                                <TableCell>Index</TableCell>
                                <TableCell sx={{ width: "100%" }}>Image</TableCell>
                                <TableCell>
                                    {selectAll
                                        ? <RotateSelector
                                            onChange={(value) => {
                                                setRotates(rotates.map(([_, checked]) => [value, checked]));
                                            }}
                                            small
                                        />
                                        : "Rotate"
                                    }
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {images.map((image, index) =>
                                <TableRow key={image.path}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectAll || rotates[index][1]}
                                            onChange={(e) => {
                                                if (!e.target.checked && selectAll)
                                                    setSelectAll(false);

                                                const newRotates = [...rotates];
                                                newRotates[index][1] = e.target.checked;
                                                setRotates(newRotates);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell sx={{ width: "100%", wordWrap: "anywhere" }}>
                                        {image.path}
                                    </TableCell>
                                    <TableCell>
                                        <RotateSelector
                                            value={rotates[index][0]}
                                            onChange={(value) => {
                                                const newRotates = [...rotates];
                                                newRotates[index][0] = value;
                                                setRotates(newRotates);
                                            }}
                                            small
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => onClose()}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            setImages(images.map((image, index) => ({
                                ...image,
                                rotate: rotates[index][0],
                            })));
                            onClose();
                        }}
                    >
                        Apply
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    )
}