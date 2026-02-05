// List of emails allowed to access the application
// Users not in this list will be signed out immediately after login
export const ALLOWED_EMAILS = [
    'thanksrgg@gmail.com', // User's email (assuming from context or placeholder)
    // 'dale8@nol-universe.com',
];

export function isEmailWhitelisted(email: string | undefined | null): boolean {
    if (!email) return false;
    return ALLOWED_EMAILS.includes(email);
}
