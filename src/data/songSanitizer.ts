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

export function getSongTitleAuthor (title: string, author: string): { title: string, author: string } {
    const sanitizedTitle = sanitizeTitle(title);
    const sanitizedAuthor = sanitizeAuthor(author);

    if (title.match(/.* - .*/) !== null) {
        return {
            title: sanitizedTitle.split(' - ')[1].replace(/-/g, '').trim(),
            author: sanitizedTitle.split(' - ')[0].replace(/-/g, '').trim()
        }
    } else {
        return {
            title: sanitizedTitle,
            author: sanitizedAuthor
        }
    }
}
