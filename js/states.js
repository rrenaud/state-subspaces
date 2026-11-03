// The 50 US states as points in 8 dimensions, grouped by Census region.
// 2022 ACS 1-year estimates, 2020 Census urban share, 2022 Gazetteer land area. The rows are written by scripts/fetch_census.py.
(function (root) {
  "use strict";
  const STATES = {
      noun: "states",
      note: "The 50 states, 2022 Census Bureau figures, with population and density on a log scale. Each state is a point in 8 dimensions, so n = 8.",
      feats: ["log Pop", "log Density", "Income", "Median age", "Bachelor's", "Urban", "Age 65+", "Poverty"],
      groups: { N: "Northeast", M: "Midwest", S: "South", W: "West", all: "All states" },
      def: ["all", "S"],
      tf: r => [Math.log10(r[0] * 1e6), Math.log10(r[1]), r[2], r[3], r[4], r[5], r[6], r[7]],
      // population (millions), density (/sq mi), median household income ($k), median age, % bachelor's+, % urban, % 65+, % poverty
      rows: [
        ["Alabama", "S", 5.074, 100.2, 59.7, 39.6, 28.8, 57.7, 18.0, 16.2], ["Alaska", "W", 0.734, 1.3, 88.1, 35.9, 30.6, 64.9, 13.8, 11.0],
        ["Arizona", "W", 7.359, 64.8, 74.6, 38.8, 33.0, 89.3, 18.8, 12.5], ["Arkansas", "S", 3.046, 58.6, 55.4, 38.9, 25.4, 55.5, 17.7, 16.8],
        ["California", "W", 39.029, 250.4, 91.6, 37.9, 37.0, 94.2, 15.8, 12.2], ["Colorado", "W", 5.840, 56.3, 89.3, 37.7, 45.9, 86.0, 15.7, 9.4],
        ["Connecticut", "N", 3.626, 748.8, 88.4, 40.9, 41.9, 86.3, 18.3, 9.8], ["Delaware", "S", 1.018, 522.6, 82.2, 41.5, 36.5, 82.6, 20.8, 9.4],
        ["Florida", "S", 22.245, 414.6, 69.3, 42.7, 34.3, 91.5, 21.6, 12.7], ["Georgia", "S", 10.913, 189.1, 72.8, 37.6, 34.7, 74.1, 15.1, 12.7],
        ["Hawaii", "W", 1.440, 224.2, 92.5, 40.8, 35.4, 86.1, 20.5, 10.2], ["Idaho", "W", 1.939, 23.5, 72.8, 37.5, 32.3, 69.2, 17.0, 10.7],
        ["Illinois", "M", 12.582, 226.6, 76.7, 39.1, 37.7, 86.9, 17.2, 11.9], ["Indiana", "M", 6.833, 190.7, 66.8, 38.2, 29.6, 71.2, 16.9, 12.6],
        ["Iowa", "M", 3.201, 57.3, 69.6, 38.9, 32.3, 63.2, 18.4, 11.0], ["Kansas", "M", 2.937, 35.9, 68.9, 37.6, 35.6, 72.3, 17.2, 12.0],
        ["Kentucky", "S", 4.512, 114.3, 59.3, 39.4, 27.9, 58.7, 17.5, 16.5], ["Louisiana", "S", 4.590, 106.2, 55.4, 38.2, 27.1, 71.5, 17.0, 18.6],
        ["Maine", "N", 1.385, 44.9, 69.5, 45.1, 36.1, 38.6, 22.6, 10.8], ["Maryland", "S", 6.165, 634.8, 95.0, 39.7, 43.8, 85.6, 16.9, 9.6],
        ["Massachusetts", "N", 6.982, 895.0, 94.5, 40.3, 46.6, 91.3, 18.0, 10.4], ["Michigan", "M", 10.034, 177.3, 67.0, 40.3, 32.1, 73.5, 18.7, 13.4],
        ["Minnesota", "M", 5.717, 71.8, 82.3, 39.0, 39.1, 71.9, 17.4, 9.6], ["Mississippi", "S", 2.940, 62.7, 52.7, 38.9, 24.8, 46.3, 17.5, 19.1],
        ["Missouri", "M", 6.178, 89.9, 64.8, 39.1, 32.2, 69.5, 18.0, 13.2], ["Montana", "W", 1.123, 7.7, 67.6, 40.2, 34.6, 53.4, 20.1, 12.1],
        ["Nebraska", "M", 1.968, 25.6, 69.6, 37.4, 34.7, 73.0, 17.0, 11.2], ["Nevada", "W", 3.178, 28.9, 72.3, 39.0, 27.0, 94.1, 16.9, 12.5],
        ["New Hampshire", "N", 1.395, 155.8, 90.0, 43.3, 41.3, 58.3, 20.2, 7.2], ["New Jersey", "N", 9.262, 1259.3, 96.3, 40.4, 43.5, 93.8, 17.4, 9.7],
        ["New Mexico", "W", 2.113, 17.4, 59.7, 39.4, 30.5, 74.5, 19.2, 17.6], ["New York", "N", 19.677, 417.6, 79.6, 40.0, 40.0, 87.4, 18.1, 14.3],
        ["North Carolina", "S", 10.699, 220.0, 67.5, 39.2, 35.9, 66.7, 17.4, 12.8], ["North Dakota", "M", 0.779, 11.3, 72.0, 36.2, 31.8, 61.0, 16.7, 11.5],
        ["Ohio", "M", 11.756, 287.7, 65.7, 39.9, 32.0, 76.3, 18.4, 13.4], ["Oklahoma", "S", 4.020, 58.6, 59.7, 37.1, 28.5, 64.6, 16.5, 15.7],
        ["Oregon", "W", 4.240, 44.2, 75.7, 40.5, 36.3, 80.5, 19.3, 12.1], ["Pennsylvania", "N", 12.972, 289.9, 71.8, 40.9, 35.1, 76.5, 19.6, 11.8],
        ["Rhode Island", "N", 1.094, 1057.9, 81.9, 40.7, 39.6, 91.1, 18.8, 10.8], ["South Carolina", "S", 5.283, 175.7, 64.1, 40.5, 32.6, 67.9, 19.1, 14.0],
        ["South Dakota", "M", 0.910, 12.0, 69.7, 38.5, 31.6, 57.2, 18.2, 12.5], ["Tennessee", "S", 7.051, 171.0, 65.3, 39.2, 31.1, 66.2, 17.3, 13.3],
        ["Texas", "S", 30.030, 114.9, 72.3, 35.6, 33.9, 83.7, 13.4, 14.0], ["Utah", "W", 3.381, 40.9, 89.2, 32.1, 37.9, 89.8, 11.9, 8.2],
        ["Vermont", "N", 0.647, 70.2, 74.0, 43.2, 44.2, 35.1, 21.6, 10.4], ["Virginia", "S", 8.684, 219.9, 85.9, 39.0, 42.2, 75.6, 16.8, 10.6],
        ["Washington", "W", 7.786, 117.2, 91.3, 38.4, 39.5, 83.4, 16.8, 10.0], ["West Virginia", "S", 1.775, 73.8, 54.3, 42.9, 24.8, 44.6, 21.2, 17.9],
        ["Wisconsin", "M", 5.893, 108.8, 71.0, 40.4, 33.2, 67.1, 18.7, 10.7], ["Wyoming", "W", 0.581, 6.0, 70.0, 39.1, 29.6, 62.0, 18.6, 11.8]
      ]
  };
  STATES.postal = { "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO",
    "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT",
    "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA",
    "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
    "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY" };

  if (typeof module !== "undefined") module.exports = STATES;
  else root.STATES = STATES;
})(globalThis);
