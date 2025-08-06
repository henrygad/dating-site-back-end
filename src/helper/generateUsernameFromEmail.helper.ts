import uniqueString from "src/utils/uniqueString.util";

export function generateUsernameFromEmail(email: string): string {
    if (!email) return "";

    else if (typeof email !== "string") {
        email = String(email);
    }

    // Clean email, by

    // 1) Get name without @domain name
    const [rawName] = email.toLowerCase().trim().split("@");
    // 2) Remove any non-alphanumeric chars
    const cleanedName = rawName.replace(/[^a-z0-9]/g, "");

    // Generate 4 unique string
    const uniqueSuffix = uniqueString(2);

    return `${cleanedName}${uniqueSuffix}`;
}
