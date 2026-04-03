/**
 * Returns a name that does not collide with the provided set of existing names.
 *
 * If `baseName` is empty or whitespace, `defaultName` is used instead.
 * When the name already exists, a numeric suffix is appended until it becomes unique.
 *
 * @param baseName - The requested name.
 * @param usedNames - The collection of names that are already taken.
 * @param defaultName - The fallback name used when `baseName` is empty.
 * @returns A unique name derived from `baseName`.
 */
export const getUniqueName = (
    baseName: string,
    usedNames: Iterable<string>,
    defaultName = "Name"
): string => {
    const normalizedBaseName = baseName.trim() || defaultName;
    const normalizedUsedNames = new Set(
        Array.from(usedNames, (name) => name.trim().toLowerCase())
    );

    if (!normalizedUsedNames.has(normalizedBaseName.toLowerCase())) {
        return normalizedBaseName;
    }

    let suffix = 1;
    let candidate = `${normalizedBaseName}${suffix}`;

    while (normalizedUsedNames.has(candidate.toLowerCase())) {
        suffix += 1;
        candidate = `${normalizedBaseName}${suffix}`;
    }

    return candidate;
};