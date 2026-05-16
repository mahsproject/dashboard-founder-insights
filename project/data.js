// Authoritative aggregates — computed directly from
// Founders_Cleaned_and_Validated.xlsx (1,450 founders, 480 companies).
// Every number here was re-derived from the cleaned row-level data
// (Founders_Only sheet), not lifted from the PDF report. Where the
// PDF and the data disagreed, the data wins.

window.FI_DATA = (() => {

  // ── Hero stats ─────────────────────────────────────────────────
  const KPI = [
    { value: "9,169", label: "people\nanalyzed"   },
    { value: "480",   label: "companies\nexamined" },
    { value: "1,450", label: "founders\nidentified" },
    { value: "51",    label: "median\nage"         },
  ];

  // ── Founder classification ─────────────────────────────────────
  const founderType = [
    { name: "Confirmed (YES)",     value: 906 },
    { name: "Likely (MD/Chairman)", value: 544 },
  ];

  // ── Education level (n=807 of 871 with edu_level set) ──────────
  const educationLevels = [
    { name: "Undergraduate",            value: 334, pct: 41.4 },
    { name: "Postgraduate",             value: 327, pct: 40.5 },
    { name: "Diploma",                  value: 83,  pct: 10.3 },
    { name: "Doctoral",                 value: 34,  pct: 4.2  },
    { name: "Professional (CA/CS/CFA)", value: 29,  pct: 3.6  },
  ];

  // ── Top 10 degrees (degree_clean) ──────────────────────────────
  const topDegrees = [
    { name: "B.Com",         value: 179 },
    { name: "B.Sc",          value: 96  },
    { name: "B.Engineering", value: 56  },
    { name: "B.Tech / B.E.", value: 51  },
    { name: "Diploma",       value: 41  },
    { name: "B.Mechanical",  value: 39  },
    { name: "B.Arts",        value: 38  },
    { name: "B.Chemical",    value: 25  },
    { name: "B.Business",    value: 25  },
    { name: "B.Electrical",  value: 22  },
  ];

  // ── Top 10 institutions (institution_clean) ────────────────────
  const topInstitutions = [
    { name: "University of Delhi",    value: 64 },
    { name: "University of Mumbai",   value: 50 },
    { name: "University of Bombay",   value: 39 },
    { name: "Gujarat University",     value: 35 },
    { name: "University of Calcutta", value: 28 },
    { name: "IIT Delhi",              value: 23 },
    { name: "Bangalore University",   value: 19 },
    { name: "University of Madras",   value: 17 },
    { name: "University of Pune",     value: 16 },
    { name: "MSU Baroda",             value: 14 },
  ];

  // ── Field of study (field_group, n=803) ────────────────────────
  const fieldsOfStudy = [
    { name: "Engineering / Technology", value: 251 },
    { name: "Commerce / Finance",       value: 195 },
    { name: "Science",                  value: 97  },
    { name: "Management / Business",    value: 87  },
    { name: "Arts / Humanities",        value: 65  },
    { name: "Other",                    value: 63  },
    { name: "Medicine / Healthcare",    value: 32  },
    { name: "Law",                      value: 7   },
    { name: "Architecture",             value: 6   },
  ];

  // ── Geography ──────────────────────────────────────────────────
  const topStates = [
    { name: "Maharashtra",   value: 125 },
    { name: "Gujarat",       value: 111 },
    { name: "Delhi",         value: 54  },
    { name: "Karnataka",     value: 43  },
    { name: "Telangana",     value: 31  },
    { name: "West Bengal",   value: 26  },
    { name: "Haryana",       value: 24  },
    { name: "Rajasthan",     value: 23  },
    { name: "Uttar Pradesh", value: 16  },
    { name: "Tamil Nadu",    value: 15  },
  ];

  const topCities = [
    { name: "Mumbai",    value: 86 },
    { name: "Delhi",     value: 54 },
    { name: "Ahmedabad", value: 41 },
    { name: "Kolkata",   value: 26 },
    { name: "Hyderabad", value: 25 },
    { name: "Bengaluru", value: 21 },
    { name: "Pune",      value: 16 },
    { name: "Vadodara",  value: 13 },
    { name: "Jaipur",    value: 12 },
    { name: "Chennai",   value: 12 },
  ];

  // ── Demographics ───────────────────────────────────────────────
  const genderSplit = [
    { name: "Male",   value: 1056, pct: 74.6 },
    { name: "Female", value: 360,  pct: 25.4 },
  ];

  // Age distribution, computed from row-level ages.
  // Coverage: 750 of 1,450 founders. Range 20–92. Median 51. Mean 51.8.
  const ageBuckets = [
    { bucket: "20–24", value: 12  },
    { bucket: "25–29", value: 17  },
    { bucket: "30–34", value: 38  },
    { bucket: "35–39", value: 68  },
    { bucket: "40–44", value: 90  },
    { bucket: "45–49", value: 110 },
    { bucket: "50–54", value: 120 },
    { bucket: "55–59", value: 85  },
    { bucket: "60–64", value: 78  },
    { bucket: "65–69", value: 52  },
    { bucket: "70–74", value: 41  },
    { bucket: "75–79", value: 27  },
    { bucket: "80–84", value: 7   },
    { bucket: "85–89", value: 3   },
    { bucket: "90–94", value: 2   },
  ];

  // ── Industries (480 unique companies, computed from sheet 9) ───
  const industries = [
    { name: "Fintech / Finance",            value: 265, pct: 55.2 },
    { name: "Technology / IT",              value: 84,  pct: 17.5 },
    { name: "Healthcare / Pharma",          value: 43,  pct: 8.96 },
    { name: "Other",                        value: 20,  pct: 4.17 },
    { name: "Metals / Mining",              value: 16,  pct: 3.33 },
    { name: "Real Estate / Infrastructure", value: 15,  pct: 3.13 },
    { name: "Retail / Consumer",            value: 10,  pct: 2.08 },
    { name: "Energy",                       value: 7,   pct: 1.46 },
    { name: "Manufacturing / Engineering",  value: 7,   pct: 1.46 },
    { name: "Automotive / Transport",       value: 5,   pct: 1.04 },
    { name: "Education",                    value: 3,   pct: 0.63 },
    { name: "Legal",                        value: 2,   pct: 0.42 },
    { name: "Consulting / Services",        value: 1,   pct: 0.21 },
    { name: "Media / Entertainment",        value: 1,   pct: 0.21 },
    { name: "Telecom",                      value: 1,   pct: 0.21 },
  ];

  // ── Coverage (validated against PDF) ───────────────────────────
  const coverage = [
    { metric: "Gender data",    have: 1416, total: 1450, pct: 98 },
    { metric: "Education data", have: 871,  total: 1450, pct: 60 },
    { metric: "Age data",       have: 750,  total: 1450, pct: 52 },
    { metric: "City + State",   have: 474,  total: 1450, pct: 33 },
  ];

  // ── Derived facts used in copy ─────────────────────────────────
  const facts = {
    confirmed: 906,
    likely: 544,
    family: 92,
    others: 7627,
    medianAge: 51,
    meanAge: 51.8,
    minAge: 20,
    maxAge: 92,
    over70: 80,        // 80 of 750 with age data
    over60: 210,
    under40: 135,
    iitTotal: 61,      // all IITs combined
    bComTotal: 179,
    westBeltShare: 16.3,  // (125 + 111) / 1450
    dateMin: "Mar 2021",
    dateMax: "Mar 2026",
    indianNationality: 1439,
    nonIndianNationality: 11,
  };

  return {
    KPI, founderType,
    educationLevels, topDegrees, topInstitutions, fieldsOfStudy,
    topStates, topCities,
    genderSplit, ageBuckets,
    industries, coverage,
    facts
  };
})();
