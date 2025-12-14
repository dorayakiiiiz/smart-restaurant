

const getTitleFromUrl = (url) => {
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.hostname;
    } catch {
        return url;
    }
}

export const Helper = {
    getTitleFromUrl
};