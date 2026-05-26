/**
 * Hierarchical location data for Malaysia.
 *
 * Used by:
 *  - The cascading State -> City -> District search dropdown on /venues
 *  - The vendor listing creation form (when wired in a follow-up commit)
 *
 * Coverage is pragmatic: every state, the cities and districts where
 * event venues realistically operate. Granular enough to be useful for
 * filtering, not so granular that the file becomes unmaintainable.
 *
 * If a vendor needs to list in a sub-district that isn't here, they can
 * still type a free-text address; structured filtering simply won't catch
 * them on neighbourhood-level searches until the data is added.
 */

export interface DistrictDef {
  name: string;
}

export interface CityDef {
  name: string;
  districts: DistrictDef[];
}

export interface StateDef {
  /** Display name shown in the dropdown */
  name: string;
  /** Stable key used in URLs and DB equality filters */
  key: string;
  cities: CityDef[];
}

export const malaysiaLocations: StateDef[] = [
  {
    name: "Kuala Lumpur",
    key: "kuala-lumpur",
    cities: [
      {
        name: "Kuala Lumpur",
        districts: [
          { name: "Bukit Bintang" },
          { name: "KLCC" },
          { name: "Bangsar" },
          { name: "Mont Kiara" },
          { name: "Damansara Heights" },
          { name: "Sentul" },
          { name: "Setapak" },
          { name: "Cheras" },
          { name: "KL Sentral" },
          { name: "Ampang" },
          { name: "Wangsa Maju" },
          { name: "Brickfields" },
          { name: "Old Klang Road" },
          { name: "Kepong" },
          { name: "Desa Park City" },
        ],
      },
    ],
  },
  {
    name: "Selangor",
    key: "selangor",
    cities: [
      {
        name: "Petaling Jaya",
        districts: [
          { name: "Damansara Utama" },
          { name: "Damansara Jaya" },
          { name: "Bandar Utama" },
          { name: "Kelana Jaya" },
          { name: "SS2" },
          { name: "Section 14" },
          { name: "Section 17" },
          { name: "Tropicana" },
          { name: "Mutiara Damansara" },
        ],
      },
      {
        name: "Shah Alam",
        districts: [
          { name: "Section 7" },
          { name: "Section 13" },
          { name: "Setia Alam" },
          { name: "Kota Kemuning" },
          { name: "i-City" },
        ],
      },
      {
        name: "Subang Jaya",
        districts: [
          { name: "USJ" },
          { name: "Sunway" },
          { name: "Bandar Sunway" },
          { name: "SS15" },
          { name: "SS19" },
        ],
      },
      {
        name: "Klang",
        districts: [
          { name: "Bandar Klang" },
          { name: "Bukit Tinggi" },
          { name: "Port Klang" },
          { name: "Meru" },
        ],
      },
      {
        name: "Ampang",
        districts: [
          { name: "Ampang Jaya" },
          { name: "Pandan Indah" },
          { name: "Ulu Kelang" },
        ],
      },
      {
        name: "Cheras",
        districts: [
          { name: "Cheras Selatan" },
          { name: "Sungai Long" },
          { name: "Bandar Mahkota Cheras" },
        ],
      },
      {
        name: "Selayang",
        districts: [
          { name: "Selayang Baru" },
          { name: "Batu Caves" },
          { name: "Rawang" },
          { name: "Kuang" },
        ],
      },
      {
        name: "Kajang",
        districts: [
          { name: "Bandar Baru Bangi" },
          { name: "Semenyih" },
          { name: "Sungai Chua" },
        ],
      },
      {
        name: "Puchong",
        districts: [
          { name: "Bandar Puteri" },
          { name: "IOI Puchong" },
          { name: "Bandar Kinrara" },
        ],
      },
    ],
  },
  {
    name: "Putrajaya",
    key: "putrajaya",
    cities: [
      {
        name: "Putrajaya",
        districts: [
          { name: "Precinct 1" },
          { name: "Precinct 2" },
          { name: "Precinct 9" },
          { name: "Precinct 11" },
          { name: "Precinct 15" },
        ],
      },
    ],
  },
  {
    name: "Penang",
    key: "penang",
    cities: [
      {
        name: "George Town",
        districts: [
          { name: "Gurney Drive" },
          { name: "Pulau Tikus" },
          { name: "Tanjung Tokong" },
          { name: "Tanjung Bungah" },
          { name: "Jelutong" },
          { name: "Air Itam" },
        ],
      },
      {
        name: "Bayan Lepas",
        districts: [{ name: "Queensbay" }, { name: "Sungai Nibong" }, { name: "Relau" }],
      },
      {
        name: "Butterworth",
        districts: [
          { name: "Seberang Jaya" },
          { name: "Bukit Mertajam" },
          { name: "Perai" },
        ],
      },
    ],
  },
  {
    name: "Johor",
    key: "johor",
    cities: [
      {
        name: "Johor Bahru",
        districts: [
          { name: "Bandar Johor Bahru" },
          { name: "Iskandar Puteri" },
          { name: "Skudai" },
          { name: "Kulai" },
          { name: "Bukit Indah" },
          { name: "Mount Austin" },
          { name: "Senai" },
        ],
      },
      {
        name: "Batu Pahat",
        districts: [{ name: "Bandar Penggaram" }, { name: "Parit Raja" }],
      },
      {
        name: "Muar",
        districts: [{ name: "Bandar Maharani" }, { name: "Tangkak" }],
      },
    ],
  },
  {
    name: "Melaka",
    key: "melaka",
    cities: [
      {
        name: "Melaka City",
        districts: [
          { name: "Jonker Street" },
          { name: "Banda Hilir" },
          { name: "Ayer Keroh" },
          { name: "Bukit Beruang" },
        ],
      },
      { name: "Alor Gajah", districts: [{ name: "Pulau Sebang" }, { name: "Tampin" }] },
    ],
  },
  {
    name: "Negeri Sembilan",
    key: "negeri-sembilan",
    cities: [
      {
        name: "Seremban",
        districts: [
          { name: "Seremban 2" },
          { name: "Senawang" },
          { name: "Rasah" },
        ],
      },
      { name: "Port Dickson", districts: [{ name: "Pasir Panjang" }, { name: "Teluk Kemang" }] },
      { name: "Nilai", districts: [{ name: "Bandar Baru Nilai" }, { name: "Nilai Impian" }] },
    ],
  },
  {
    name: "Perak",
    key: "perak",
    cities: [
      {
        name: "Ipoh",
        districts: [
          { name: "Ipoh Garden" },
          { name: "Greentown" },
          { name: "Bercham" },
          { name: "Tasek" },
          { name: "Old Town" },
        ],
      },
      { name: "Taiping", districts: [{ name: "Aulong" }, { name: "Kamunting" }] },
      { name: "Sitiawan", districts: [{ name: "Lumut" }, { name: "Manjung" }] },
    ],
  },
  {
    name: "Pahang",
    key: "pahang",
    cities: [
      {
        name: "Kuantan",
        districts: [{ name: "Indera Mahkota" }, { name: "Beserah" }, { name: "Tanah Putih" }],
      },
      { name: "Cameron Highlands", districts: [{ name: "Tanah Rata" }, { name: "Brinchang" }] },
      { name: "Bentong", districts: [{ name: "Karak" }] },
    ],
  },
  {
    name: "Kedah",
    key: "kedah",
    cities: [
      { name: "Alor Setar", districts: [{ name: "Bandar Alor Setar" }, { name: "Anak Bukit" }] },
      { name: "Sungai Petani", districts: [{ name: "Bandar Sungai Petani" }, { name: "Bedong" }] },
      { name: "Langkawi", districts: [{ name: "Kuah" }, { name: "Pantai Cenang" }, { name: "Pantai Tengah" }] },
    ],
  },
  {
    name: "Perlis",
    key: "perlis",
    cities: [{ name: "Kangar", districts: [{ name: "Bandar Kangar" }, { name: "Arau" }] }],
  },
  {
    name: "Kelantan",
    key: "kelantan",
    cities: [
      { name: "Kota Bharu", districts: [{ name: "Bandar Kota Bharu" }, { name: "Kubang Kerian" }] },
    ],
  },
  {
    name: "Terengganu",
    key: "terengganu",
    cities: [
      { name: "Kuala Terengganu", districts: [{ name: "Bandar KT" }, { name: "Chendering" }] },
      { name: "Kemaman", districts: [{ name: "Cukai" }, { name: "Kerteh" }] },
    ],
  },
  {
    name: "Sabah",
    key: "sabah",
    cities: [
      {
        name: "Kota Kinabalu",
        districts: [
          { name: "Likas" },
          { name: "Sembulan" },
          { name: "Inanam" },
          { name: "Penampang" },
          { name: "Tanjung Aru" },
        ],
      },
      { name: "Sandakan", districts: [{ name: "Bandar Sandakan" }] },
      { name: "Tawau", districts: [{ name: "Bandar Tawau" }] },
    ],
  },
  {
    name: "Sarawak",
    key: "sarawak",
    cities: [
      {
        name: "Kuching",
        districts: [
          { name: "Bandar Kuching" },
          { name: "Padungan" },
          { name: "Tabuan Jaya" },
          { name: "Petra Jaya" },
        ],
      },
      { name: "Miri", districts: [{ name: "Bandar Miri" }, { name: "Permyjaya" }] },
      { name: "Sibu", districts: [{ name: "Bandar Sibu" }, { name: "Sungai Merah" }] },
    ],
  },
  {
    name: "Labuan",
    key: "labuan",
    cities: [{ name: "Labuan", districts: [{ name: "Bandar Labuan" }] }],
  },
];

/**
 * Look up a state by its key.
 */
export function findState(key: string): StateDef | undefined {
  return malaysiaLocations.find((s) => s.key === key);
}

/**
 * Look up the cities of a given state key. Returns [] for unknown states.
 */
export function getCities(stateKey: string): CityDef[] {
  return findState(stateKey)?.cities ?? [];
}

/**
 * Look up the districts of a given state + city. Returns [] for unknown.
 */
export function getDistricts(stateKey: string, cityName: string): DistrictDef[] {
  const state = findState(stateKey);
  return state?.cities.find((c) => c.name === cityName)?.districts ?? [];
}
