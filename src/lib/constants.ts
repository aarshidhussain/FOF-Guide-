import { TreeSpecies, LibraryItem } from './types';

export const MOCK_SPECIES: TreeSpecies[] = [
  {
    id: '1',
    commonName: 'Deodar Cedar',
    scientificName: 'Cedrus deodara',
    location: {
      lat: 34.15,
      lng: 74.85,
      description: 'Near the Faculty Main Entrance'
    },
    researchTopics: ['Growth patterns in Kashmir', 'Carbon sequestration'],
    description: 'A large evergreen coniferous tree reaching 40–50 m tall.',
    researchSummary: `### Research Overview
Deodar is a significant species in the forest and the broader Himalayan region.

*   **Carbon Sequestration:** Studies indicate high sequestration potential in high-altitude zones.
*   **Timber Quality:** Valued for its durable, rot-resistant wood.
*   **Climate Sensitivity:** Recent data shows sensitivity to changing precipitation patterns in the valley.
*   **Research Plot 4:** Currently monitored for annual ring studies.`
  },
  {
    id: '2',
    commonName: 'Kashmir Cypress',
    scientificName: 'Cupressus cashmeriana',
    location: {
      lat: 34.152,
      lng: 74.852,
      description: 'Arboretum area'
    },
    researchTopics: ['Conservation status', 'Genetic diversity'],
    description: 'An elegant coniferous tree with weeping blue-green foliage.',
    researchSummary: `### Conservation Status
Critically acclaimed as one of the most beautiful conifers.

*   **Genetic Diversity:** Current research focuses on micro-propagation to preserve genetic lines.
*   **Endemic Value:** Highly specialized for the temperate climate of the Kashmir valley.
*   **Arboretum Study:** The arboretum specimen is part of a 20-year longitudinal growth trial.`
  }
];

export const MOCK_LIBRARY: LibraryItem[] = [
  {
    id: 'b1',
    title: 'Silviculture of Indian Trees',
    author: 'R.S. Troup',
    type: 'book',
    location: 'Main Library',
    shelf: 'Section A - Silviculture'
  },
  {
    id: 'p1',
    title: 'Forest Resources of Jammu & Kashmir',
    author: 'Forestry Research',
    type: 'paper',
    location: 'Archive Section',
    shelf: 'R-2023'
  }
];
