import { cleanPhoneDigits, formatPhoneNumber } from "../components/phone-input/phone-format";

/**
 * Country definitions, ISO-3166-1 alpha-2 codes, international dial codes, and emoji flags.
 */

export type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

/**
 * Computes the Unicode emoji flag for a 2-letter ISO 3166-1 alpha-2 country code.
 */
export function countryCodeToFlag({ code }: { code: string }): string {
  const upper = code.trim().toUpperCase();
  if (upper.length !== 2) return "🌐";
  const first = upper.charCodeAt(0) - 65;
  const second = upper.charCodeAt(1) - 65;
  if (first < 0 || first > 25 || second < 0 || second > 25) return "🌐";
  return String.fromCodePoint(0x1f1e6 + first, 0x1f1e6 + second);
}

/**
 * Comprehensive list of countries sorted with Nordic / European priority, then alphabetical.
 */
export const COUNTRIES: readonly Country[] = [
  // Primary Nordic & European markets
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮" },
  { code: "IS", name: "Iceland", dialCode: "+354", flag: "🇮🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
  { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱" },
  { code: "EE", name: "Estonia", dialCode: "+372", flag: "🇪🇪" },
  { code: "LV", name: "Latvia", dialCode: "+371", flag: "🇱🇻" },
  { code: "LT", name: "Lithuania", dialCode: "+370", flag: "🇱🇹" },
  { code: "CZ", name: "Czech Republic", dialCode: "+420", flag: "🇨🇿" },
  { code: "SK", name: "Slovakia", dialCode: "+421", flag: "🇸🇰" },
  { code: "HU", name: "Hungary", dialCode: "+36", flag: "🇭🇺" },
  { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷" },
  { code: "HR", name: "Croatia", dialCode: "+385", flag: "🇭🇷" },
  { code: "SI", name: "Slovenia", dialCode: "+386", flag: "🇸🇮" },
  { code: "RO", name: "Romania", dialCode: "+40", flag: "🇷🇴" },
  { code: "BG", name: "Bulgaria", dialCode: "+359", flag: "🇧🇬" },
  { code: "CY", name: "Cyprus", dialCode: "+357", flag: "🇨🇾" },
  { code: "MT", name: "Malta", dialCode: "+356", flag: "🇲🇹" },
  { code: "LU", name: "Luxembourg", dialCode: "+352", flag: "🇱🇺" },
  { code: "AL", name: "Albania", dialCode: "+355", flag: "🇦🇱" },
  { code: "AD", name: "Andorra", dialCode: "+376", flag: "🇦🇩" },
  { code: "BA", name: "Bosnia and Herzegovina", dialCode: "+387", flag: "🇧🇦" },
  { code: "GE", name: "Georgia", dialCode: "+995", flag: "🇬🇪" },
  { code: "LI", name: "Liechtenstein", dialCode: "+423", flag: "🇱🇮" },
  { code: "MC", name: "Monaco", dialCode: "+377", flag: "🇲🇨" },
  { code: "MD", name: "Moldova", dialCode: "+373", flag: "🇲🇩" },
  { code: "ME", name: "Montenegro", dialCode: "+382", flag: "🇲🇪" },
  { code: "MK", name: "North Macedonia", dialCode: "+389", flag: "🇲🇰" },
  { code: "RS", name: "Serbia", dialCode: "+381", flag: "🇷🇸" },
  { code: "SM", name: "San Marino", dialCode: "+378", flag: "🇸🇲" },
  { code: "UA", name: "Ukraine", dialCode: "+380", flag: "🇺🇦" },
  // Rest of the world
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "HK", name: "Hong Kong", dialCode: "+852", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan", dialCode: "+886", flag: "🇹🇼" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { code: "PE", name: "Peru", dialCode: "+51", flag: "🇵🇪" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱" },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { code: "MA", name: "Morocco", dialCode: "+212", flag: "🇲🇦" },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0] ?? {
  code: "SE",
  name: "Sweden",
  dialCode: "+46",
  flag: "🇸🇪",
};

const COUNTRY_BY_CODE = new Map<string, Country>(
  COUNTRIES.map((country) => [country.code.toUpperCase(), country]),
);

/**
 * Returns country information by ISO 3166-1 alpha-2 code.
 */
export function findCountryByCode({ code }: { code: string }): Country | undefined {
  return COUNTRY_BY_CODE.get(code.trim().toUpperCase());
}

/** Sorted dial codes from longest to shortest to ensure accurate prefix matching. */
const DIAL_CODE_PRIORITY = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

/**
 * Detects the country matching a given phone number.
 * Numbers starting with '0' default to Sweden; international numbers match by dial code.
 */
export function detectCountryFromPhone({ phone }: { phone: string }): Country {
  const clean = cleanPhoneDigits({ value: phone });
  if (clean.startsWith("0")) return DEFAULT_COUNTRY;
  if (clean.startsWith("+")) {
    for (const country of DIAL_CODE_PRIORITY) {
      if (clean.startsWith(country.dialCode)) {
        return country;
      }
    }
  }
  return DEFAULT_COUNTRY;
}

/**
 * Returns a localized country name using Intl.DisplayNames if supported,
 * falling back to the default English country name.
 */
export function localizedCountryName({
  code,
  locale = "en",
}: {
  code: string;
  locale?: string;
}): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "region" });
    const name = displayNames.of(code.toUpperCase());
    if (name) return name;
  } catch {
    // Fall back to predefined list
  }
  const found = findCountryByCode({ code });
  return found?.name ?? code.toUpperCase();
}

export type ApplyCountryDialCodeInput = {
  phone: string;
  country: Country;
};

/**
 * Replaces or prepends a country's dial code onto an existing phone number string.
 * Formats the resulting phone number according to that country's conventions.
 */
export function applyCountryDialCode({ phone, country }: ApplyCountryDialCodeInput): string {
  const clean = cleanPhoneDigits({ value: phone });
  if (!clean || clean === "+") {
    return `${country.dialCode} `;
  }

  // If already starts with '+', remove the existing country dial code
  if (clean.startsWith("+")) {
    const detected = detectCountryFromPhone({ phone: clean });
    let nationalPart = "";
    if (clean.startsWith(detected.dialCode)) {
      nationalPart = clean.slice(detected.dialCode.length);
    } else {
      const match = clean.match(/^\+\d{1,3}/);
      nationalPart = match ? clean.slice(match[0].length) : clean.slice(1);
    }
    if (nationalPart.startsWith("0")) {
      nationalPart = nationalPart.slice(1);
    }
    const combined = `${country.dialCode}${nationalPart}`;
    return formatPhoneNumber({ value: combined });
  }

  // If starts with '0' (e.g. Swedish national 070-123 45 67)
  if (clean.startsWith("0")) {
    const nationalPart = clean.slice(1);
    const combined = `${country.dialCode}${nationalPart}`;
    return formatPhoneNumber({ value: combined });
  }

  // Raw digits without prefix
  const combined = `${country.dialCode}${clean}`;
  return formatPhoneNumber({ value: combined });
}
