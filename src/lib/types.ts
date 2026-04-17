export interface TreeSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  location: {
    lat: number | null;
    lng: number | null;
    description: string;
  };
  researchTopics: string[];
  description: string;
  researchSummary?: string;
  imageUrl?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  type: 'book' | 'paper' | 'thesis';
  location: string;
  shelf: string;
  year?: number;
  abstract?: string;
  downloadUrl?: string;
}

export type AppTab = 'home' | 'species' | 'library' | 'research' | 'map';
