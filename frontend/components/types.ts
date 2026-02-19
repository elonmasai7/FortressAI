export type SlideId =
  | 'title'
  | 'crisis'
  | 'nightmare'
  | 'agents'
  | 'tunnels'
  | 'demo'
  | 'architecture'
  | 'market'
  | 'metrics'
  | 'winner'
  | 'ask'
  | 'contact';

export type SlideMeta = {
  id: SlideId;
  title: string;
};

export type BaseSlideProps = {
  isActive: boolean;
};
