import { useState, useEffect, useCallback } from 'react';
import { LOCAL_FONTS, loadLocalFont, type LocalFont } from '@/utils/localFonts';

export interface UseLocalFontsReturn {
  fonts: LocalFont[];
  isLoading: boolean;
  loadFont: (fontFamily: string) => void;
  loadedFonts: Set<string>;
}

const loadedFontsSet = new Set<string>();

export function useLocalFonts(): UseLocalFontsReturn {
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(loadedFontsSet);

  const loadFont = useCallback((fontFamily: string) => {
    if (loadedFontsSet.has(fontFamily)) return;
    
    loadLocalFont(fontFamily);
    loadedFontsSet.add(fontFamily);
    setLoadedFonts(new Set(loadedFontsSet));
  }, []);

  // Load all fonts on mount
  useEffect(() => {
    LOCAL_FONTS.forEach((font) => {
      loadLocalFont(font.family);
      loadedFontsSet.add(font.family);
    });
    setLoadedFonts(new Set(loadedFontsSet));
  }, []);

  return {
    fonts: LOCAL_FONTS,
    isLoading: false,
    loadFont,
    loadedFonts,
  };
}
