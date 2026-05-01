/** Maps the country names used in CITIES to ISO 3166-1 alpha-2 codes. */
const COUNTRY_TO_ISO: Record<string, string> = {
  Italy: 'it',
  Spain: 'es',
  Netherlands: 'nl',
  Greece: 'gr',
  Croatia: 'hr',
  Iceland: 'is',
  France: 'fr',
  Japan: 'jp',
  Indonesia: 'id',
  Thailand: 'th',
  Philippines: 'ph',
  Cambodia: 'kh',
  'South Korea': 'kr',
  USA: 'us',
  Peru: 'pe',
  Brazil: 'br',
  Mexico: 'mx',
  Egypt: 'eg',
  'South Africa': 'za',
  Australia: 'au',
  Ecuador: 'ec',
  'New Zealand': 'nz',
};

export type FlagSize = 'w20' | 'w40' | 'w80' | 'w160' | 'w320';

/**
 * Return a PNG flag URL from flagcdn.com for the given country name.
 * Returns empty string if the country isn't mapped.
 */
export function getFlagUrl(country: string, size: FlagSize = 'w80'): string {
  const code = COUNTRY_TO_ISO[country];
  return code ? `https://flagcdn.com/${size}/${code}.png` : '';
}
