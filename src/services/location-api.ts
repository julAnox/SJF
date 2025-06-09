export interface CountryAPI {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  flag: string;
}

export interface RegionAPI {
  name: string;
  iso2: string;
}

export interface CityAPI {
  name: string;
  id: number;
}

export interface Country {
  name: string;
  isoCode: string;
  flag?: string;
}

export interface Region {
  name: string;
  isoCode: string;
}

export interface City {
  name: string;
  id: string | number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1,
  delayMs = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) {
        console.log(`Retry attempt ${i} for API call`);
        await delay(delayMs * i);
      }
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`API call failed on attempt ${i + 1}:`, error);

      if (i === maxRetries) {
        break;
      }
    }
  }

  throw lastError!;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

class LocationAPIService {
  private countriesCache: Country[] | null = null;
  private regionsCache: Map<string, Region[]> = new Map();
  private citiesCache: Map<string, City[]> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();

  async getAllCountries(): Promise<Country[]> {
    if (this.countriesCache) {
      console.log("Using cached countries");
      return this.countriesCache;
    }

    const cacheKey = "countries";
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this.fetchCountries();
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(cacheKey);
      return result;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      throw error;
    }
  }

  private async fetchCountries(): Promise<Country[]> {
    console.log("Fetching countries from REST Countries API...");

    const endpoints = [
      "https://restcountries.com/v3.1/all?fields=name,cca2,flag",
      "https://restcountries.com/v3/all?fields=name,cca2,flag",
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);

        const response = await withRetry(async () => {
          const res = await fetchWithTimeout(endpoint, {}, 8000);

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          return res;
        }, 1);

        const data: CountryAPI[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Invalid data format received");
        }

        const countries: Country[] = data
          .filter(
            (country) => country.name && country.name.common && country.cca2
          )
          .map((country) => ({
            name: country.name.common,
            isoCode: country.cca2,
            flag: country.flag || "",
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        console.log(
          `Successfully loaded ${countries.length} countries from ${endpoint}`
        );
        this.countriesCache = countries;
        return countries;
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
        continue;
      }
    }

    console.error("All countries API endpoints failed");
    throw new Error("Failed to load countries from any API endpoint");
  }

  async getStatesOfCountry(countryCode: string): Promise<Region[]> {
    if (!countryCode) {
      console.warn("No country code provided for regions");
      return [];
    }

    const cacheKey = countryCode;
    if (this.regionsCache.has(cacheKey)) {
      console.log(`Using cached regions for ${countryCode}`);
      return this.regionsCache.get(cacheKey)!;
    }

    if (this.pendingRequests.has(`regions-${cacheKey}`)) {
      return this.pendingRequests.get(`regions-${cacheKey}`);
    }

    const promise = this.fetchRegions(countryCode);
    this.pendingRequests.set(`regions-${cacheKey}`, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(`regions-${cacheKey}`);
      return result;
    } catch (error) {
      this.pendingRequests.delete(`regions-${cacheKey}`);
      throw error;
    }
  }

  private async fetchRegions(countryCode: string): Promise<Region[]> {
    console.log(`Loading regions for country: ${countryCode}`);

    const countryName = this.getCountryNameByCode(countryCode);
    console.log(`Trying API for ${countryCode} (${countryName})`);

    const endpoints = [
      "https://countriesnow.space/api/v0.1/countries/states",
      "https://api.countrystatecity.in/v1/countries/" + countryCode + "/states",
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying regions endpoint: ${endpoint}`);

        let response;
        if (endpoint.includes("countriesnow")) {
          response = await withRetry(async () => {
            const res = await fetchWithTimeout(
              endpoint,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  country: countryName,
                }),
              },
              6000
            );

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            return res;
          }, 1);

          const data = await response.json();

          if (data.error || !data.data || !data.data.states) {
            throw new Error("API returned no data or error");
          }

          const regions: Region[] = data.data.states.map(
            (state: any, index: number) => ({
              name: state.name,
              isoCode: state.state_code || `${countryCode}-${index}`,
            })
          );

          console.log(
            `Successfully loaded ${regions.length} regions from countriesnow for ${countryCode}`
          );
          this.regionsCache.set(countryCode, regions);
          return regions;
        } else if (endpoint.includes("countrystatecity")) {
          response = await withRetry(async () => {
            const res = await fetchWithTimeout(
              endpoint,
              {
                headers: {
                  "X-CSCAPI-KEY": "YOUR_API_KEY_HERE",
                },
              },
              6000
            );

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }

            return res;
          }, 1);

          const data = await response.json();

          if (!Array.isArray(data)) {
            throw new Error("Invalid data format");
          }

          const regions: Region[] = data.map((state: any) => ({
            name: state.name,
            isoCode: state.iso2,
          }));

          console.log(
            `Successfully loaded ${regions.length} regions from countrystatecity for ${countryCode}`
          );
          this.regionsCache.set(countryCode, regions);
          return regions;
        }
      } catch (error) {
        console.error(`Error with regions endpoint ${endpoint}:`, error);
        continue;
      }
    }

    console.warn(`All regions API endpoints failed for ${countryCode}`);
    const emptyRegions: Region[] = [];
    this.regionsCache.set(countryCode, emptyRegions);
    return emptyRegions;
  }

  async getCitiesOfState(
    countryCode: string,
    stateCode: string
  ): Promise<City[]> {
    if (!countryCode || !stateCode) {
      console.warn("Missing country or state code for cities");
      return [];
    }

    const cacheKey = `${countryCode}-${stateCode}`;
    if (this.citiesCache.has(cacheKey)) {
      console.log(`Using cached cities for ${cacheKey}`);
      return this.citiesCache.get(cacheKey)!;
    }

    if (this.pendingRequests.has(`cities-${cacheKey}`)) {
      return this.pendingRequests.get(`cities-${cacheKey}`);
    }

    const promise = this.fetchCities(countryCode, stateCode);
    this.pendingRequests.set(`cities-${cacheKey}`, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(`cities-${cacheKey}`);
      return result;
    } catch (error) {
      this.pendingRequests.delete(`cities-${cacheKey}`);
      throw error;
    }
  }

  private async fetchCities(
    countryCode: string,
    stateCode: string
  ): Promise<City[]> {
    const cacheKey = `${countryCode}-${stateCode}`;
    console.log(`Loading cities for ${cacheKey}`);

    const countryName = this.getCountryNameByCode(countryCode);
    const stateName = this.getRegionNameByCode(countryCode, stateCode);

    console.log(`Trying API for cities: ${countryName}/${stateName}`);

    const endpoints = [
      "https://countriesnow.space/api/v0.1/countries/state/cities",
      "https://countriesnow.space/api/v0.1/countries/cities",
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying cities endpoint: ${endpoint}`);

        let requestBody;
        if (endpoint.includes("state/cities")) {
          requestBody = {
            country: countryName,
            state: stateName,
          };
        } else {
          requestBody = {
            country: countryName,
          };
        }

        const response = await withRetry(async () => {
          const res = await fetchWithTimeout(
            endpoint,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            },
            6000
          );

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          return res;
        }, 1);

        const data = await response.json();

        if (data.error || !data.data) {
          throw new Error("API returned no data or error");
        }

        let citiesData;
        if (Array.isArray(data.data)) {
          citiesData = data.data;
        } else if (data.data.cities && Array.isArray(data.data.cities)) {
          citiesData = data.data.cities;
        } else {
          throw new Error("Invalid cities data format");
        }

        const cities: City[] = citiesData.map(
          (cityName: string, index: number) => ({
            name: cityName,
            id: `${cacheKey}-${index}`,
          })
        );

        console.log(
          `Successfully loaded ${cities.length} cities for ${cacheKey}`
        );
        this.citiesCache.set(cacheKey, cities);
        return cities;
      } catch (error) {
        console.error(`Error with cities endpoint ${endpoint}:`, error);
        continue;
      }
    }

    console.warn(`All cities API endpoints failed for ${cacheKey}`);
    const emptyCities: City[] = [];
    this.citiesCache.set(cacheKey, emptyCities);
    return emptyCities;
  }

  findCountryByName(countryName: string): Country | null {
    if (!countryName || !this.countriesCache) return null;

    const searchName = countryName.toLowerCase().trim();

    let found = this.countriesCache.find(
      (country) => country.name.toLowerCase() === searchName
    );

    if (!found) {
      found = this.countriesCache.find(
        (country) =>
          country.name.toLowerCase().includes(searchName) ||
          searchName.includes(country.name.toLowerCase())
      );
    }

    return found || null;
  }

  findRegionByName(countryCode: string, regionName: string): Region | null {
    if (!regionName || !countryCode) return null;

    const regions = this.regionsCache.get(countryCode) || [];
    const searchName = regionName.toLowerCase().trim();

    return (
      regions.find((region) => region.name.toLowerCase() === searchName) || null
    );
  }

  findCityByName(
    countryCode: string,
    stateCode: string,
    cityName: string
  ): City | null {
    if (!cityName || !countryCode || !stateCode) return null;

    const cacheKey = `${countryCode}-${stateCode}`;
    const cities = this.citiesCache.get(cacheKey) || [];
    const searchName = cityName.toLowerCase().trim();

    return (
      cities.find((city) => city.name.toLowerCase() === searchName) || null
    );
  }

  private getCountryNameByCode(code: string): string {
    const countryMap: { [key: string]: string } = {
      RU: "Russia",
      US: "United States",
      DE: "Germany",
      FR: "France",
      GB: "United Kingdom",
      CA: "Canada",
      AU: "Australia",
      JP: "Japan",
      CN: "China",
      IN: "India",
      BR: "Brazil",
      MX: "Mexico",
      IT: "Italy",
      ES: "Spain",
      NL: "Netherlands",
      PL: "Poland",
      TR: "Turkey",
      KR: "South Korea",
      UA: "Ukraine",
      KZ: "Kazakhstan",
      AE: "United Arab Emirates",
      SA: "Saudi Arabia",
      EG: "Egypt",
      ZA: "South Africa",
      NG: "Nigeria",
      KE: "Kenya",
      AR: "Argentina",
      CL: "Chile",
      CO: "Colombia",
      PE: "Peru",
      VE: "Venezuela",
      TH: "Thailand",
      VN: "Vietnam",
      MY: "Malaysia",
      SG: "Singapore",
      ID: "Indonesia",
      PH: "Philippines",
      BD: "Bangladesh",
      PK: "Pakistan",
      IR: "Iran",
      IQ: "Iraq",
      IL: "Israel",
      JO: "Jordan",
      LB: "Lebanon",
      SY: "Syria",
      GR: "Greece",
      BG: "Bulgaria",
      RO: "Romania",
      HU: "Hungary",
      CZ: "Czech Republic",
      SK: "Slovakia",
      SI: "Slovenia",
      HR: "Croatia",
      RS: "Serbia",
      BA: "Bosnia and Herzegovina",
      MK: "North Macedonia",
      AL: "Albania",
      ME: "Montenegro",
      FI: "Finland",
      SE: "Sweden",
      NO: "Norway",
      DK: "Denmark",
      IS: "Iceland",
      IE: "Ireland",
      PT: "Portugal",
      AT: "Austria",
      CH: "Switzerland",
      BE: "Belgium",
      LU: "Luxembourg",
    };

    if (this.countriesCache) {
      const country = this.countriesCache.find((c) => c.isoCode === code);
      if (country) {
        return country.name;
      }
    }

    return countryMap[code] || code;
  }

  private getRegionNameByCode(countryCode: string, regionCode: string): string {
    const regions = this.regionsCache.get(countryCode) || [];
    const region = regions.find((r) => r.isoCode === regionCode);
    return region?.name || regionCode;
  }

  clearCache(): void {
    console.log("Clearing location API cache");
    this.countriesCache = null;
    this.regionsCache.clear();
    this.citiesCache.clear();
    this.pendingRequests.clear();
  }

  async checkAPIHealth(): Promise<{
    countries: boolean;
    regions: boolean;
    cities: boolean;
  }> {
    const health = {
      countries: false,
      regions: false,
      cities: false,
    };

    try {
      const countriesResponse = await fetchWithTimeout(
        "https://restcountries.com/v3.1/all?fields=name&limit=1",
        {},
        3000
      );
      health.countries = countriesResponse.ok;
    } catch (error) {
      console.warn("Countries API is not available:", error);
    }

    try {
      const regionsResponse = await fetchWithTimeout(
        "https://countriesnow.space/api/v0.1/countries/states",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: "United States" }),
        },
        3000
      );
      health.regions = regionsResponse.ok;
      health.cities = regionsResponse.ok;
    } catch (error) {
      console.warn("Regions/Cities API is not available:", error);
    }

    console.log("API Health Check:", health);
    return health;
  }
}

export const locationAPI = new LocationAPIService();

if (typeof window !== "undefined") {
  (window as any).locationAPI = locationAPI;
}
