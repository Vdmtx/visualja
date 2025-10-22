export interface UserInput {
  companyName: string;
  location: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface GeneratedContent {
  mediaPlan?: { target: string; source: string };
  marketStrategy?: { target: string; source: string; usp?: string; adjectives?: { adj1: string; adj2: string; }; scene?: string; };
  logos?: string[];
  banners?: string[];
}

export enum Step {
  Introduction,
  ProjectSetup,
  MediaPlan,
  MarketStrategy,
  LogoCreation,
  BannerCreation,
  Conclusion,
}