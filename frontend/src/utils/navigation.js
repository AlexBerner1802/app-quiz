export function normalizeIdForUrl(id) {
    if (id === null || id === undefined) return null;
    const s = String(id);
    if (s === "undefined" || s === "null" || s.trim() === "") return null;
    return s;
}

export function safeEditorPath(id) {
    const safe = normalizeIdForUrl(id);
    return safe ? `/quizzes/${encodeURIComponent(safe)}/edit` : null;
}

export function safeNavigateToEditor(navigate, id) {
    const path = safeEditorPath(id);
    if (path) {
        navigate(path);
    } else {
        console.error("[safeNavigateToEditor] id invalide :", id);
    }
}