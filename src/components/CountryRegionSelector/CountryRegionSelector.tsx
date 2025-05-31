"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Country, State, City } from "country-state-city";
import { Globe, MapPin } from "lucide-react";

interface LocationData {
  country: string;
  region: string;
  district: string;
}

interface CountryRegionSelectorProps {
  initialValues: LocationData;
  onChange: (data: LocationData) => void;
}

const CountryRegionSelector = ({
  initialValues,
  onChange,
}: CountryRegionSelectorProps) => {
  const [countries, setCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string>(
    initialValues.country || ""
  );
  const [selectedRegion, setSelectedRegion] = useState<string>(
    initialValues.region || ""
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialValues.district || ""
  );

  const [countryObj, setCountryObj] = useState<any>(null);
  const [regionObj, setRegionObj] = useState<any>(null);

  // Load countries on component mount
  useEffect(() => {
    try {
      const allCountries = Country.getAllCountries();
      setCountries(allCountries);

      // If we have an initial country value, find the country object
      if (initialValues.country) {
        const foundCountry = allCountries.find(
          (country) =>
            country.name.toLowerCase() === initialValues.country.toLowerCase()
        );

        if (foundCountry) {
          setCountryObj(foundCountry);
        }
      }
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }, [initialValues.country]);

  // When country changes, load regions
  useEffect(() => {
    if (countryObj) {
      try {
        const countryRegions = State.getStatesOfCountry(countryObj.isoCode);
        setRegions(countryRegions);

        // If we have an initial region value, find the region object
        if (initialValues.region) {
          const foundRegion = countryRegions.find(
            (region) =>
              region.name.toLowerCase() === initialValues.region.toLowerCase()
          );

          if (foundRegion) {
            setRegionObj(foundRegion);
          } else {
            // Reset region if it doesn't exist in the new country
            setSelectedRegion("");
            setRegionObj(null);
            onChange({
              country: selectedCountry,
              region: "",
              district: "",
            });
          }
        }
      } catch (error) {
        console.error("Error loading regions:", error);
        setRegions([]);
      }
    } else {
      setRegions([]);
      setRegionObj(null);
    }
  }, [countryObj, initialValues.region, selectedCountry, onChange]);

  // When region changes, load cities/districts
  useEffect(() => {
    if (countryObj && regionObj) {
      try {
        const regionCities = City.getCitiesOfState(
          countryObj.isoCode,
          regionObj.isoCode
        );
        setCities(regionCities);

        // If we have an initial district value, check if it exists
        if (initialValues.district) {
          const foundCity = regionCities.find(
            (city) =>
              city.name.toLowerCase() === initialValues.district.toLowerCase()
          );

          if (!foundCity) {
            // Reset district if it doesn't exist in the new region
            setSelectedDistrict("");
            onChange({
              country: selectedCountry,
              region: selectedRegion,
              district: "",
            });
          }
        }
      } catch (error) {
        console.error("Error loading cities:", error);
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [
    regionObj,
    countryObj,
    initialValues.district,
    selectedCountry,
    selectedRegion,
    onChange,
  ]);

  // Handle country selection
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryName = e.target.value;
    setSelectedCountry(countryName);

    const selectedCountryObj = countries.find(
      (country) => country.name === countryName
    );
    setCountryObj(selectedCountryObj || null);

    // Reset region and district when country changes
    setSelectedRegion("");
    setSelectedDistrict("");
    setRegionObj(null);

    onChange({
      country: countryName,
      region: "",
      district: "",
    });
  };

  // Handle region selection
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionName = e.target.value;
    setSelectedRegion(regionName);

    const selectedRegionObj = regions.find(
      (region) => region.name === regionName
    );
    setRegionObj(selectedRegionObj || null);

    // Reset district when region changes
    setSelectedDistrict("");

    onChange({
      country: selectedCountry,
      region: regionName,
      district: "",
    });
  };

  // Handle district selection
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtName = e.target.value;
    setSelectedDistrict(districtName);

    onChange({
      country: selectedCountry,
      region: selectedRegion,
      district: districtName,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Country Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Country
        </label>
        <div className="relative">
          <select
            name="country"
            value={selectedCountry}
            onChange={handleCountryChange}
            className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
          >
            <option value="">Select a country</option>
            {countries.map((country) => (
              <option key={country.isoCode} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Region Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Region
        </label>
        <div className="relative">
          <select
            name="region"
            value={selectedRegion}
            onChange={handleRegionChange}
            disabled={!countryObj}
            className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a region</option>
            {regions.map((region) => (
              <option key={region.isoCode} value={region.name}>
                {region.name}
              </option>
            ))}
          </select>
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {/* District/City Selector */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          District
        </label>
        <div className="relative">
          <select
            name="district"
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={!regionObj}
            className="w-full px-4 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a district</option>
            {cities.map((city) => (
              <option key={city.id || city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryRegionSelector;
export { CountryRegionSelector };
