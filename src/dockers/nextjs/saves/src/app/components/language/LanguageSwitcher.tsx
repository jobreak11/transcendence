"use client";

import {
  useLanguage,
  type Language,
} from "./LanguageProvider";

const languageOptions: Array<{
  value: Language;
  shortLabel: string;
  fullLabel: string;
  flag: string;
}> = [
  {
    value: "en",
    shortLabel: "EN",
    fullLabel: "English",
    flag: "🇬🇧",
  },
  {
    value: "th",
    shortLabel: "TH",
    fullLabel: "ไทย",
    flag: "🇹🇭",
  },
  {
    value: "cn",
    shortLabel: "中文",
    fullLabel: "中文",
    flag: "🇨🇳",
  },
];

export default function LanguageSwitcher() {
  const {
    language,
    dictionary,
    setLanguage,
  } = useLanguage();

  const selectedLanguage =
    languageOptions.find(
      (option) =>
        option.value === language,
    ) ?? languageOptions[0];

  return (
    <div className="relative inline-flex items-center gap-1.5 text-white">
      <span
        aria-hidden="true"
        className="text-lg"
      >
        {selectedLanguage.flag}
      </span>

      <label
        htmlFor="language-selector"
        className="sr-only"
      >
        {dictionary.language.select}
      </label>

      <select
        id="language-selector"
        value={language}
        aria-label={
          dictionary.language.select
        }
        onChange={(event) =>
          setLanguage(
            event.target
              .value as Language,
          )
        }
        className="
          cursor-pointer
          appearance-none
          border-0
          bg-black
          py-1
          pr-5
          text-base
          font-medium
          text-white
          outline-none
          focus:ring-2
          focus:ring-red-500
        "
      >
        {languageOptions.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-black text-white"
            >
              {option.fullLabel}
            </option>
          ),
        )}
      </select>

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-0
          text-[10px]
          text-white
        "
      >
        ▼
      </span>
    </div>
  );
}