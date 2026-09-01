import Papa from "papaparse";

// ── Types ──────────────────────────────
export type CsvRow = {
    name: string;
    description?: string | undefined;
    price: number;
    quantity: number;
    imageUrl?: string | undefined;
};

export type RowError = {
    rowNumber: number; // 1-indexed, matches what admin sees in their spreadsheet (header = row 1)
    errors: string[];
    raw: Record<string, string>;
};

export type ValidationResult = {
    valid: CsvRow[];
    errors: RowError[];
    duplicatesInFile: { name: string; rowNumbers: number[] }[];
    fatalError?: string; // set when the file can't be processed at all (bad headers, too many rows, parse failure)
};

const REQUIRED_COLUMNS = ["name", "price", "quantity"];
const OPTIONAL_COLUMNS = ["description", "imageurl"];
const ALL_KNOWN_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];
const MAX_ROWS = 500;

function normalizeHeader(header: string): string {
    return header.trim().toLowerCase();
}

function validateHeaders(headers: string[]): string[] {
    const normalized = headers.map(normalizeHeader);
    const missing = REQUIRED_COLUMNS.filter((col) => !normalized.includes(col));
    const unknown = normalized.filter((h) => !ALL_KNOWN_COLUMNS.includes(h));

    const errors: string[] = [];
    if (missing.length > 0) {
        errors.push(`Missing required column(s): ${missing.join(", ")}`);
    }
    if (unknown.length > 0) {
        errors.push(`Unrecognized column(s), will be ignored: ${unknown.join(", ")}`);
    }
    return errors;
}

function validateRow(
    row: Record<string, string>,
    rowNumber: number,
): { row: CsvRow | null; errors: string[] } {
    const errors: string[] = [];

    const getField = (key: string) => {
        const matchKey = Object.keys(row).find((k) => normalizeHeader(k) === key);
        return matchKey ? row[matchKey]?.trim() ?? "" : "";
    };

    const name = getField("name");
    const descriptionRaw = getField("description");
    const priceRaw = getField("price");
    const quantityRaw = getField("quantity");
    const imageUrlRaw = getField("imageurl");

    if (!name) errors.push("Name is required");

    let price = NaN;
    if (!priceRaw) {
        errors.push("Price is required");
    } else {
        price = Number(priceRaw);
        if (Number.isNaN(price)) errors.push(`Price "${priceRaw}" is not a valid number`);
        else if (price < 0) errors.push("Price cannot be negative");
    }

    let quantity = NaN;
    if (!quantityRaw) {
        errors.push("Quantity is required");
    } else {
        quantity = Number(quantityRaw);
        if (Number.isNaN(quantity)) errors.push(`Quantity "${quantityRaw}" is not a valid number`);
        else if (!Number.isInteger(quantity)) errors.push("Quantity must be a whole number");
        else if (quantity < 0) errors.push("Quantity cannot be negative");
    }

    if (imageUrlRaw && !/^https?:\/\/.+/i.test(imageUrlRaw)) {
        errors.push(`Image URL "${imageUrlRaw}" doesn't look like a valid http(s) URL`);
    }

    if (errors.length > 0) return { row: null, errors };

    return {
        row: {
            name,
            description: descriptionRaw || undefined,
            price,
            quantity,
            imageUrl: imageUrlRaw || undefined,
        },
        errors: [],
    };
}

function findDuplicatesInFile(
    rows: { row: CsvRow; rowNumber: number }[],
): { name: string; rowNumbers: number[] }[] {
    const seen = new Map<string, number[]>();
    for (const { row, rowNumber } of rows) {
        const key = row.name.toLowerCase();
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(rowNumber);
    }
    return Array.from(seen.entries())
        .filter(([, rowNumbers]) => rowNumbers.length > 1)
        .map(([name, rowNumbers]) => ({ name, rowNumbers }));
}

function runValidation(parsedRows: Record<string, string>[]): Omit<ValidationResult, "fatalError"> {
    const errors: RowError[] = [];
    const validCandidates: { row: CsvRow; rowNumber: number }[] = [];

    parsedRows.forEach((raw, index) => {
        const rowNumber = index + 2; // +1 for 0-index, +1 because header is row 1
        const { row, errors: rowErrors } = validateRow(raw, rowNumber);
        if (row) validCandidates.push({ row, rowNumber });
        else errors.push({ rowNumber, errors: rowErrors, raw });
    });

    const duplicatesInFile = findDuplicatesInFile(validCandidates);
    const duplicateNames = new Set(duplicatesInFile.map((d) => d.name));

    const valid = validCandidates
        .filter(({ row }) => !duplicateNames.has(row.name.toLowerCase()))
        .map(({ row }) => row);

    return { valid, errors, duplicatesInFile };
}

// ── The function you'll actually call from your component ──────────────────────────────
export function validateEquipmentCsv(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
        const isCsv = file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
        if (!isCsv) {
            resolve({ valid: [], errors: [], duplicatesInFile: [], fatalError: "Only .csv files are supported" });
            return;
        }

        Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                const headerErrors = validateHeaders(headers);

                if (headerErrors.some((e) => e.startsWith("Missing"))) {
                    resolve({ valid: [], errors: [], duplicatesInFile: [], fatalError: headerErrors.join(" | ") });
                    return;
                }

                if (results.data.length > MAX_ROWS) {
                    resolve({
                        valid: [],
                        errors: [],
                        duplicatesInFile: [],
                        fatalError: `File has ${results.data.length} rows — max allowed is ${MAX_ROWS}`,
                    });
                    return;
                }

                resolve(runValidation(results.data));
            },
            error: (err) => {
                resolve({ valid: [], errors: [], duplicatesInFile: [], fatalError: `Failed to parse CSV: ${err.message}` });
            },
        });
    });
}