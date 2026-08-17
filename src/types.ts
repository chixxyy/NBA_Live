export interface Player {
  id: string | number;
  name: string;
  team: string;
  position: string;
  lineupPosition?: string;
  isBench?: boolean;
  originalTier?: 'S' | 'A' | 'B' | 'C' | 'D';
  originalPrice?: number;
  price: number;
  score: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
}
