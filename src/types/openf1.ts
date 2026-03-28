export interface Session {
  session_key: number;
  session_name: string;
  session_type: string;
  status: string;
  date_start: string;
  date_end: string | null;
  gmt_offset: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
  circuit_key: number;
  year: number;
}

export interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string; // hex without #
  first_name: string;
  last_name: string;
  headshot_url: string;
  country_code: string;
  session_key: number;
  meeting_key: number;
}

export interface Location {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  x: number;
  y: number;
  z: number;
}

export interface Position {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  position: number;
}

export interface Interval {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  gap_to_leader: string | number | null;
  interval: string | number | null;
}

export interface Lap {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
  date_start: string;
}

export interface CarData {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  speed: number;
  n_gear: number;
  rpm: number;
  throttle: number;
  brake: number;
  drs: number;
}

export interface DriverWithData extends Driver {
  position?: number;
  gap_to_leader?: string | number | null;
  interval?: string | number | null;
  currentLocation?: Location;
}
