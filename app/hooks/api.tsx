import ky from "ky"


export const api = ky.create({
    timeout: 38000,
    retry: 0,
    headers: {
        "Content-Type": "application/json"
    },
});