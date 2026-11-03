// The 50 US states as points in 8 dimensions, grouped by Census region.
// Values are approximate (roughly 2022 Census and ACS), typed from memory for illustration; don't cite them.
(function (root) {
  "use strict";
  const STATES = {
      noun: "states",
      note: "The 50 states, roughly 2022 Census figures, with population and density on a log scale. Each state is a point in 8 dimensions, so n = 8.",
      feats: ["log Pop", "log Density", "Income", "Median age", "Bachelor's", "Urban", "Age 65+", "Poverty"],
      groups: { N: "Northeast", M: "Midwest", S: "South", W: "West", all: "All states" },
      def: ["all", "S"],
      tf: r => [Math.log10(r[0] * 1e6), Math.log10(r[1]), r[2], r[3], r[4], r[5], r[6], r[7]],
      // population (millions), density (/sq mi), median household income ($k), median age, % bachelor's+, % urban, % 65+, % poverty
      rows: [
        ["Alabama", "S", 5.07, 100, 59.6, 39.6, 27.2, 57.7, 17.6, 15.6], ["Alaska", "W", 0.73, 1.3, 86.4, 35.5, 30.6, 64.9, 13.5, 10.5],
        ["Arizona", "W", 7.36, 65, 72.6, 38.6, 31.8, 89.3, 18.4, 12.5], ["Arkansas", "S", 3.05, 59, 56.3, 38.5, 25.0, 55.5, 17.8, 16.0],
        ["California", "W", 39.0, 250, 91.6, 37.6, 36.5, 94.2, 15.2, 12.0], ["Colorado", "W", 5.84, 56, 87.6, 37.5, 44.4, 86.0, 15.1, 9.4],
        ["Connecticut", "N", 3.62, 745, 88.4, 41.2, 41.9, 86.3, 18.0, 10.0], ["Delaware", "S", 1.02, 520, 79.3, 41.4, 35.0, 82.6, 20.0, 11.1],
        ["Florida", "S", 22.2, 410, 69.3, 42.7, 32.3, 91.5, 21.6, 12.7], ["Georgia", "S", 10.9, 190, 72.8, 37.6, 33.6, 74.1, 14.9, 13.5],
        ["Hawaii", "W", 1.44, 225, 92.5, 40.1, 34.7, 86.1, 20.0, 10.2], ["Idaho", "W", 1.94, 23, 70.2, 37.4, 29.9, 69.3, 16.8, 10.9],
        ["Illinois", "M", 12.6, 228, 78.4, 39.2, 37.0, 86.8, 16.6, 11.8], ["Indiana", "M", 6.83, 190, 67.2, 38.0, 28.4, 70.5, 16.6, 12.3],
        ["Iowa", "M", 3.20, 57, 70.6, 38.4, 30.7, 63.0, 18.0, 11.1], ["Kansas", "M", 2.94, 36, 69.7, 37.2, 35.1, 69.0, 16.8, 11.3],
        ["Kentucky", "S", 4.53, 115, 60.2, 39.2, 26.5, 57.6, 17.4, 16.1], ["Louisiana", "S", 4.59, 106, 57.9, 37.7, 26.1, 69.3, 16.9, 18.6],
        ["Maine", "N", 1.39, 45, 68.3, 45.1, 34.4, 38.7, 22.5, 10.8], ["Maryland", "S", 6.18, 636, 98.5, 39.3, 42.5, 86.9, 16.6, 9.6],
        ["Massachusetts", "N", 7.00, 900, 96.5, 40.3, 46.6, 91.3, 18.0, 10.4], ["Michigan", "M", 10.0, 178, 68.5, 40.2, 31.7, 73.6, 18.7, 13.1],
        ["Minnesota", "M", 5.72, 72, 84.3, 38.8, 38.5, 71.9, 17.1, 9.3], ["Mississippi", "S", 2.94, 63, 52.7, 38.3, 23.9, 46.3, 17.1, 19.1],
        ["Missouri", "M", 6.18, 90, 65.9, 39.1, 31.2, 69.5, 17.9, 12.7], ["Montana", "W", 1.12, 7.7, 67.6, 40.1, 34.0, 53.4, 20.0, 12.1],
        ["Nebraska", "M", 1.97, 26, 71.7, 37.0, 33.8, 73.0, 16.6, 10.4], ["Nevada", "W", 3.18, 29, 72.3, 38.6, 26.5, 94.1, 17.0, 12.8],
        ["New Hampshire", "N", 1.40, 157, 90.8, 43.3, 39.6, 58.3, 19.9, 7.2], ["New Jersey", "N", 9.29, 1260, 97.1, 40.1, 42.9, 94.0, 17.1, 9.7],
        ["New Mexico", "W", 2.11, 17, 58.7, 39.1, 29.1, 74.5, 19.3, 18.4], ["New York", "N", 19.6, 415, 81.4, 39.6, 39.9, 87.4, 17.9, 13.6],
        ["North Carolina", "S", 10.8, 220, 66.2, 39.2, 34.9, 66.7, 17.4, 13.3], ["North Dakota", "M", 0.78, 11, 73.0, 35.6, 31.4, 61.2, 16.4, 10.6],
        ["Ohio", "M", 11.8, 288, 66.0, 39.6, 30.8, 77.9, 18.2, 13.3], ["Oklahoma", "S", 4.05, 59, 59.7, 37.0, 27.3, 64.6, 16.4, 15.3],
        ["Oregon", "W", 4.23, 44, 76.6, 40.1, 35.9, 80.5, 19.2, 12.0], ["Pennsylvania", "N", 13.0, 290, 71.8, 40.9, 34.5, 76.6, 19.6, 11.8],
        ["Rhode Island", "N", 1.09, 1060, 81.4, 40.4, 37.5, 91.0, 18.6, 11.4], ["South Carolina", "S", 5.37, 178, 64.1, 40.3, 31.5, 67.9, 19.0, 14.0],
        ["South Dakota", "M", 0.91, 12, 69.5, 37.6, 30.6, 56.7, 18.0, 12.3], ["Tennessee", "S", 7.13, 173, 65.3, 39.0, 30.5, 66.2, 17.2, 13.6],
        ["Texas", "S", 30.0, 115, 73.0, 35.6, 32.3, 83.7, 13.4, 14.0], ["Utah", "W", 3.38, 41, 89.2, 31.8, 36.0, 89.8, 11.7, 8.6],
        ["Vermont", "N", 0.65, 70, 74.0, 43.0, 42.0, 35.1, 21.1, 10.4], ["Virginia", "S", 8.68, 220, 87.2, 38.9, 41.0, 75.5, 16.9, 10.0],
        ["Washington", "W", 7.81, 117, 91.3, 38.2, 38.0, 83.4, 16.2, 9.9], ["West Virginia", "S", 1.77, 73, 55.2, 42.8, 24.1, 44.6, 21.0, 16.7],
        ["Wisconsin", "M", 5.91, 109, 72.5, 40.0, 32.0, 67.1, 18.2, 10.6], ["Wyoming", "W", 0.58, 6, 70.0, 38.6, 29.2, 64.6, 18.7, 11.0]
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
