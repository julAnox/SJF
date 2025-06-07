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

  return (
    <div className="relative">
      <style jsx>{`
        .react-tel-input {
          font-family: inherit;
        }

        .react-tel-input .form-control {
          width: 100%;
          height: 40px;
          padding-left: 48px;
          border-radius: 0.5rem;
          background-color: rgb(55, 65, 81);
          border: 1px solid rgb(75, 85, 99);
          color: white;
        }

        .react-tel-input .form-control:focus {
          box-shadow: 0 0 0 2px rgb(5, 150, 105);
          border-color: rgb(5, 150, 105);
          outline: none;
        }

        .react-tel-input .flag-dropdown {
          background-color: rgb(55, 65, 81);
          border: 1px solid rgb(75, 85, 99);
          border-radius: 0.5rem 0 0 0.5rem;
        }

        .react-tel-input .selected-flag {
          background-color: rgb(55, 65, 81);
          border-radius: 0.5rem 0 0 0.5rem;
        }

        .react-tel-input .selected-flag:hover,
        .react-tel-input .selected-flag:focus {
          background-color: rgb(75, 85, 99);
        }

        .react-tel-input .country-list {
          background-color: rgb(55, 65, 81);
          border: 1px solid rgb(75, 85, 99);
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
        }

        .react-tel-input .country-list .country {
          color: white;
        }

        .react-tel-input .country-list .country.highlight,
        .react-tel-input .country-list .country:hover {
          background-color: rgb(75, 85, 99);
        }

        .react-tel-input .country-list .divider {
          border-bottom-color: rgb(75, 85, 99);
        }

        .react-tel-input .country-list .search {
          background-color: rgb(55, 65, 81);
        }

        .react-tel-input .country-list .search-box {
          background-color: rgb(55, 65, 81);
          border: 1px solid rgb(75, 85, 99);
          color: white;
        }
      `}</style>
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
        searchClass="search-box"
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
        }}
      />
    </div>
  );
};

export default PhoneInputWithFlag;
export { PhoneInputWithFlag };
