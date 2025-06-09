"use client";

import { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneInputWithFlagProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PhoneInputWithFlag = ({
  value,
  onChange,
  placeholder = "Enter your phone number",
  disabled = false,
}: PhoneInputWithFlagProps) => {
  const [phoneNumber, setPhoneNumber] = useState(value || "");

  useEffect(() => {
    if (value !== phoneNumber) {
      setPhoneNumber(value);
    }
  }, [value, phoneNumber]);

  const handleChange = (value: string) => {
    const formattedValue = value.startsWith("+") ? value : `+${value}`;
    setPhoneNumber(formattedValue);
    onChange(formattedValue);
  };

  const customStyles = `
    .phone-input-container .react-tel-input {
      font-family: inherit;
    }

    .phone-input-container .react-tel-input .form-control {
      width: 100%;
      height: 40px;
      padding-left: 48px;
      border-radius: 0.5rem;
      background-color: rgb(55, 65, 81);
      border: 1px solid rgb(75, 85, 99);
      color: white;
    }

    .phone-input-container .react-tel-input .form-control:focus {
      box-shadow: 0 0 0 2px rgb(5, 150, 105);
      border-color: rgb(5, 150, 105);
      outline: none;
    }

    .phone-input-container .react-tel-input .form-control::placeholder {
      color: rgb(156, 163, 175);
    }

    .phone-input-container .react-tel-input .flag-dropdown {
      background-color: rgb(55, 65, 81);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 0.5rem 0 0 0.5rem;
    }

    .phone-input-container .react-tel-input .selected-flag {
      background-color: rgb(55, 65, 81);
      border-radius: 0.5rem 0 0 0.5rem;
      padding: 0 8px;
    }

    .phone-input-container .react-tel-input .selected-flag:hover,
    .phone-input-container .react-tel-input .selected-flag:focus {
      background-color: rgb(75, 85, 99);
    }

    .phone-input-container .react-tel-input .country-list {
      background-color: rgb(55, 65, 81);
      border: 1px solid rgb(75, 85, 99);
      border-radius: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      width: 300px;
      margin-top: 5px;
    }

    .phone-input-container .react-tel-input .country-list .country {
      color: white;
      padding: 8px 12px;
      display: flex;
      align-items: center;
    }

    .phone-input-container .react-tel-input .country-list .country.highlight,
    .phone-input-container .react-tel-input .country-list .country:hover {
      background-color: rgb(75, 85, 99);
    }

    .phone-input-container .react-tel-input .country-list .divider {
      border-bottom-color: rgb(75, 85, 99);
    }

    .phone-input-container .react-tel-input .country-list .country .country-name {
      margin-right: auto;
    }
    
    .phone-input-container .react-tel-input .country-list .country .dial-code {
      color: rgb(156, 163, 175);
      font-size: 12px;
    }
    
    /* Hide search completely */
    .phone-input-container .react-tel-input .country-list .search {
      display: none !important;
    }
    
    .phone-input-container .react-tel-input .search-emoji {
      display: none !important;
    }
    
    .phone-input-container .react-tel-input .country-list .search-box {
      display: none !important;
    }
    
    /* Fix scrollbar styling */
    .phone-input-container .react-tel-input .country-list::-webkit-scrollbar {
      width: 8px;
    }
    
    .phone-input-container .react-tel-input .country-list::-webkit-scrollbar-track {
      background: rgb(55, 65, 81);
      border-radius: 0 4px 4px 0;
    }
    
    .phone-input-container .react-tel-input .country-list::-webkit-scrollbar-thumb {
      background-color: rgb(75, 85, 99);
      border-radius: 4px;
    }
  `;

  return (
    <div className="relative phone-input-container">
      {/* Inject styles using a style tag */}
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <PhoneInput
        country={"us"}
        value={phoneNumber}
        onChange={handleChange}
        inputProps={{
          name: "phone",
          placeholder,
          disabled,
        }}
        containerClass="react-tel-input"
        dropdownClass="country-dropdown"
        enableSearch={false}
        containerStyle={{
          width: "100%",
        }}
        inputStyle={{
          width: "100%",
          height: "40px",
          paddingLeft: "48px",
          borderRadius: "0.5rem",
          backgroundColor: "rgb(55, 65, 81)",
          border: "1px solid rgb(75, 85, 99)",
          color: "white",
          fontSize: "14px",
        }}
        buttonStyle={{
          backgroundColor: "rgb(55, 65, 81)",
          border: "1px solid rgb(75, 85, 99)",
          borderRadius: "0.5rem 0 0 0.5rem",
          borderRight: "none",
        }}
        countryCodeEditable={false}
        preferredCountries={["ru", "us", "gb", "de", "fr"]}
      />
    </div>
  );
};

export default PhoneInputWithFlag;
export { PhoneInputWithFlag };
