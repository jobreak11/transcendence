"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import englishDictionary from "../../../dictionaries/en.json";
import thaiDictionary from "../../../dictionaries/th.json";
import chineseDictionary from "../../../dictionaries/cn.json";

export type Language =
  | "en"
  | "th"
  | "cn";

export type Dictionary =
  typeof englishDictionary;

// English as a base

const dictionaries = {
  en: englishDictionary,
  th: thaiDictionary,
  cn: chineseDictionary,
} satisfies Record<
  Language,
  Dictionary
>;

type LanguageContextValue = {
  language: Language;
  dictionary: Dictionary;

  setLanguage: (
    language: Language,
  ) => void;
};

const LanguageContext =
  createContext<
    LanguageContextValue | undefined
  >(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

function isLanguage(
  value: string | null,
): value is Language {
  return (
    value === "en" ||
    value === "th" ||
    value === "cn"
  );
}

export default function LanguageProvider({
  children,
}: LanguageProviderProps) {
  const [language, setLanguageState] =
    useState<Language>("en");

  /*
   * Load the previously selected language when
   * the application starts in the browser.
   */
  useEffect(() => {
    const savedLanguage =
      window.localStorage.getItem(
        "transcend-language",
      );

    if (isLanguage(savedLanguage)) {
      setLanguageState(savedLanguage);

      document.documentElement.lang =
        savedLanguage;
    }
  }, []);

  function setLanguage(
    nextLanguage: Language,
  ) {
    setLanguageState(nextLanguage);

    window.localStorage.setItem(
      "transcend-language",
      nextLanguage,
    );

    document.documentElement.lang =
      nextLanguage;
  }

  const value = useMemo(
    () => ({
      language,
      dictionary:
        dictionaries[language],
      setLanguage,
    }),
    [language],
  );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider.",
    );
  }

  return context;
}
