export function sanitizeTitle (title: string): string {
    title = title.replace(/\(.*\)/g, '').trim();
    title = title.replace(/\[.*\]/g, '').trim();
    const trimMatchIndex = title.search(/(ft(\.| )?|feat(\.| )?|featuring |\|)/g)
    if (trimMatchIndex !== -1) {
        title = title.substring(0, trimMatchIndex);
    }
    return title.trim();
}

export function sanitizeAuthor (author: string): string {
    return author.replace(/\(.*\)/g, '').trim();
}
