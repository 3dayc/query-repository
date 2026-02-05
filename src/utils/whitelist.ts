export const ALLOWED_EMAILS = [
    'thanksrgg@gmail.com',
    'dale8@nol-universe.com',
    // '9mini@nol-universe.com',
    // 'raina@nol-universe.com',
    'amy25@nol-universe.com',
    // 'chloe@nol-universe.com',
];

export const SUPER_ADMIN_EMAILS = [
    'thanksrgg@gmail.com',
];

export function isEmailWhitelisted(email: string | undefined | null): boolean {
    if (!email) return false;
    return ALLOWED_EMAILS.includes(email.toLowerCase().trim());
}

export function isSuperAdmin(email: string | undefined | null): boolean {
    if (!email) return false;
    return SUPER_ADMIN_EMAILS.includes(email);
}
