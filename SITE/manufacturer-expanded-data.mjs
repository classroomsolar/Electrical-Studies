// Additive public-source records verified 2026-10-18. Original manufacturer-data.mjs and master XLSX are unchanged.
// Same record contract as manufacturerRecords; no automatic defaults for missing fault parameters.
export const expandedManufacturerRecords = [
  {
    "id": "CURATED-TX-SE-EXN45T3HCU",
    "kind": "transformer",
    "manufacturer": "Schneider Electric / Square D",
    "model": "EXN45T3HCU",
    "title": "Square D EXN45T3HCU — 45 kVA, 480 delta / 208Y/120 V",
    "sourceUrl": "https://productinfo.se.com/nadigest/5c51d645347bdf0001f1f280/Master/17714_MAIN%20(bookmap)_0000061044.xml/$/DOE-2016-EE-Three-Phase-Transformers-EXN-EX",
    "page": "EXN & EX Three-Phase 60 Hz, 208Y/120 Vac Secondary; 480 Vac Delta Primary, Copper Windings table, row EXN45T3HCU",
    "checkedAt": "2026-10-18",
    "sourceRevision": "Revision/date not stated on public manufacturer web table; checked 2026-10-18",
    "values": {
      "v1": 480,
      "v2": 208,
      "power": 45000,
      "zPercent": 3.44,
      "frequency": 60
    },
    "ratings": [],
    "referenceOnlyFields": {
      "phases": 3,
      "primaryConnection": "delta",
      "secondaryConnection": "wye",
      "secondaryLineNeutralV": 120,
      "windingMaterial": "copper",
      "temperatureRiseC": 150,
      "insulationClassC": 220,
      "zQualification": "Manufacturer nominal catalogue %IZ; installed nameplate/test impedance has not been confirmed"
    },
    "notes": [
      "Catalogue impedance is nominal; verify exact installed nameplate and test report before engineering use.",
      "No X/R, vector-group clock number or grounding arrangement is inferred from the winding voltages."
    ],
    "missing": [
      "X/R",
      "installed/nameplate-confirmed impedance",
      "vector-group clock number / phase shift",
      "secondary grounding arrangement"
    ]
  },
  {
    "id": "CURATED-TX-SE-EXN75T3HCU",
    "kind": "transformer",
    "manufacturer": "Schneider Electric / Square D",
    "model": "EXN75T3HCU",
    "sourceConflict": {"classification": "OEM_PUBLISHED_CATALOGUE_IMPEDANCE_CONFLICT", "reason": "Schneider Digest Plus and EXN 7400CT1901 catalogue both name this model but list different nominal %IZ. Do not auto-apply either value; verify installed unit nameplate and Schneider revision with the manufacturer.", "digestZPercent": 4.99, "otherCatalogZPercent": 5.56, "url": "https://productinfo.se.com/7400ct1901exnlowvoltdisttrnsf/7400ct1901-exn-low-voltage-distribution-transformers-catalog/7400CT1901%20EXN%20Low%20Voltage%20Distribution%20Transformers%20Catalog/English/CatalogSquare%20D%E2%84%A2%20Brand%20EXN%20Low%20Voltage%20Distribution%20Transformers7400CT19_0000365311.xml/%24/ConceptTitle-47191DDD4"},

    "title": "Square D EXN75T3HCU — 75 kVA, 480 delta / 208Y/120 V",
    "sourceUrl": "https://productinfo.se.com/nadigest/5c51d645347bdf0001f1f280/Master/17714_MAIN%20(bookmap)_0000061044.xml/$/DOE-2016-EE-Three-Phase-Transformers-EXN-EX",
    "page": "EXN & EX Three-Phase 60 Hz, 208Y/120 Vac Secondary; 480 Vac Delta Primary, Copper Windings table, row EXN75T3HCU",
    "checkedAt": "2026-10-18",
    "sourceRevision": "Revision/date not stated on public manufacturer web table; checked 2026-10-18",
    "values": {
      "v1": 480,
      "v2": 208,
      "power": 75000,
      "zPercent": 4.99,
      "frequency": 60
    },
    "ratings": [],
    "referenceOnlyFields": {
      "phases": 3,
      "primaryConnection": "delta",
      "secondaryConnection": "wye",
      "secondaryLineNeutralV": 120,
      "windingMaterial": "copper",
      "temperatureRiseC": 150,
      "insulationClassC": 220,
      "zQualification": "Manufacturer nominal catalogue %IZ; installed nameplate/test impedance has not been confirmed"
    },
    "notes": [
      "Catalogue impedance is nominal; verify exact installed nameplate and test report before engineering use.",
      "No X/R, vector-group clock number or grounding arrangement is inferred from the winding voltages."
    ],
    "missing": [
      "X/R",
      "installed/nameplate-confirmed impedance",
      "vector-group clock number / phase shift",
      "secondary grounding arrangement"
    ]
  },
  {
    "id": "CURATED-TX-SE-EXN150T3HCU",
    "kind": "transformer",
    "manufacturer": "Schneider Electric / Square D",
    "model": "EXN150T3HCU",
    "sourceConflict": {"classification": "OEM_PUBLISHED_CATALOGUE_IMPEDANCE_CONFLICT", "reason": "Schneider Digest Plus and EXN 7400CT1901 catalogue both name this model but list different nominal %IZ. Do not auto-apply either value; verify installed unit nameplate and Schneider revision with the manufacturer.", "digestZPercent": 3.6, "otherCatalogZPercent": 3.79, "url": "https://productinfo.se.com/7400ct1901exnlowvoltdisttrnsf/7400ct1901-exn-low-voltage-distribution-transformers-catalog/7400CT1901%20EXN%20Low%20Voltage%20Distribution%20Transformers%20Catalog/English/CatalogSquare%20D%E2%84%A2%20Brand%20EXN%20Low%20Voltage%20Distribution%20Transformers7400CT19_0000365311.xml/%24/ConceptTitle-47191DDD6"},

    "title": "Square D EXN150T3HCU — 150 kVA, 480 delta / 208Y/120 V",
    "sourceUrl": "https://productinfo.se.com/nadigest/5c51d645347bdf0001f1f280/Master/17714_MAIN%20(bookmap)_0000061044.xml/$/DOE-2016-EE-Three-Phase-Transformers-EXN-EX",
    "page": "EXN & EX Three-Phase 60 Hz, 208Y/120 Vac Secondary; 480 Vac Delta Primary, Copper Windings table, row EXN150T3HCU",
    "checkedAt": "2026-10-18",
    "sourceRevision": "Revision/date not stated on public manufacturer web table; checked 2026-10-18",
    "values": {
      "v1": 480,
      "v2": 208,
      "power": 150000,
      "zPercent": 3.6,
      "frequency": 60
    },
    "ratings": [],
    "referenceOnlyFields": {
      "phases": 3,
      "primaryConnection": "delta",
      "secondaryConnection": "wye",
      "secondaryLineNeutralV": 120,
      "windingMaterial": "copper",
      "temperatureRiseC": 150,
      "insulationClassC": 220,
      "zQualification": "Manufacturer nominal catalogue %IZ; installed nameplate/test impedance has not been confirmed"
    },
    "notes": [
      "Catalogue impedance is nominal; verify exact installed nameplate and test report before engineering use.",
      "No X/R, vector-group clock number or grounding arrangement is inferred from the winding voltages."
    ],
    "missing": [
      "X/R",
      "installed/nameplate-confirmed impedance",
      "vector-group clock number / phase shift",
      "secondary grounding arrangement"
    ]
  },
  {
    "id": "CURATED-TX-SE-EXN75T1814H",
    "kind": "transformer",
    "manufacturer": "Schneider Electric / Square D",
    "model": "EXN75T1814H",
    "title": "Square D EXN75T1814H — 75 kVA, 480 delta / 480Y/277 V",
    "sourceUrl": "https://productinfo.se.com/nadigest/5c51d645347bdf0001f1f280/Master/17714_MAIN%20(bookmap)_0000061044.xml/$/DOE-2016-EE-Three-Phase-Transformers-EXN-EX",
    "page": "EXN & EX Three-Phase 60 Hz, 480Y/277 Vac Secondary; 480 Vac Delta Primary, Aluminum Windings table, row EXN75T1814H",
    "checkedAt": "2026-10-18",
    "sourceRevision": "Revision/date not stated on public manufacturer web table; checked 2026-10-18",
    "values": {
      "v1": 480,
      "v2": 480,
      "power": 75000,
      "zPercent": 5.03,
      "frequency": 60
    },
    "ratings": [],
    "referenceOnlyFields": {
      "phases": 3,
      "primaryConnection": "delta",
      "secondaryConnection": "wye",
      "secondaryLineNeutralV": 277,
      "windingMaterial": "aluminum",
      "temperatureRiseC": 150,
      "insulationClassC": 220,
      "zQualification": "Manufacturer nominal catalogue %IZ; installed nameplate/test impedance has not been confirmed"
    },
    "notes": [
      "Catalogue impedance is nominal; verify exact installed nameplate and test report before engineering use.",
      "No X/R, vector-group clock number or grounding arrangement is inferred from the winding voltages."
    ],
    "missing": [
      "X/R",
      "installed/nameplate-confirmed impedance",
      "vector-group clock number / phase shift",
      "secondary grounding arrangement"
    ]
  },
  {
    "id": "CURATED-BRK-SE-HDL36100",
    "kind": "switchgear",
    "equipmentType": "breaker",
    "manufacturer": "Schneider Electric / Square D",
    "model": "HDL36100",
    "title": "Square D PowerPacT HDL36100 — 100 A, three-pole, D interrupting level",
    "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/GeneralInforamtion3-6D3FBC55",
    "supportingSources": [
      {
        "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/CircuitBreakers2-6D40FD79",
        "page": "H-Frame Standard (80%) Rated 150 A Unit-Mount Thermal-Magnetic Circuit Breakers; three-pole 600 Vac 50/60 Hz table; 100 A row"
      }
    ],
    "page": "Interrupting Rating table, D level, UL/CSA/NOM columns; SKU identified in supporting 100 A row",
    "checkedAt": "2026-10-18",
    "sourceRevision": "0611CT1001 public manufacturer web catalogue; page revision/date not stated",
    "values": {
      "ratedVoltage": 600,
      "continuousA": 100
    },
    "ratings": [
      {
        "system": "AC",
        "voltage": 240,
        "interruptA": 25000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      },
      {
        "system": "AC",
        "voltage": 480,
        "interruptA": 18000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      },
      {
        "system": "AC",
        "voltage": 600,
        "interruptA": 14000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      }
    ],
    "referenceOnlyFields": {
      "poles": 3,
      "frameA": 150,
      "tripType": "thermal-magnetic",
      "continuousLoadingBasis": "standard 80%-rated breaker; not 100%-rated configuration",
      "frequencyHz": [
        50,
        60
      ],
      "instantaneousMagneticHoldA": 900,
      "instantaneousMagneticTripA": 1700,
      "currentLimiting": false
    },
    "notes": [
      "Use the interrupting rating at the applicable connected AC voltage; do not combine the 600 V maximum with the 240 V interrupting value.",
      "The magnetic hold/trip band is not total clearing time. Interrupting capacity is not downstream assembly SCCR or peak let-through."
    ],
    "missing": [
      "total clearing time at study fault current",
      "peak let-through at study fault current",
      "installed accessory/suffix configuration"
    ]
  },
  {
    "id": "CURATED-BRK-SE-HGL36100",
    "kind": "switchgear",
    "equipmentType": "breaker",
    "manufacturer": "Schneider Electric / Square D",
    "model": "HGL36100",
    "title": "Square D PowerPacT HGL36100 — 100 A, three-pole, G interrupting level",
    "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/GeneralInforamtion3-6D3FBC55",
    "supportingSources": [
      {
        "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/CircuitBreakers2-6D40FD79",
        "page": "H-Frame Standard (80%) Rated 150 A Unit-Mount Thermal-Magnetic Circuit Breakers; three-pole 600 Vac 50/60 Hz table; 100 A row"
      }
    ],
    "page": "Interrupting Rating table, G level, UL/CSA/NOM columns; SKU identified in supporting 100 A row",
    "checkedAt": "2026-10-18",
    "sourceRevision": "0611CT1001 public manufacturer web catalogue; page revision/date not stated",
    "values": {
      "ratedVoltage": 600,
      "continuousA": 100
    },
    "ratings": [
      {
        "system": "AC",
        "voltage": 240,
        "interruptA": 65000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      },
      {
        "system": "AC",
        "voltage": 480,
        "interruptA": 35000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      },
      {
        "system": "AC",
        "voltage": 600,
        "interruptA": 18000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      }
    ],
    "referenceOnlyFields": {
      "poles": 3,
      "frameA": 150,
      "tripType": "thermal-magnetic",
      "continuousLoadingBasis": "standard 80%-rated breaker; not 100%-rated configuration",
      "frequencyHz": [
        50,
        60
      ],
      "instantaneousMagneticHoldA": 900,
      "instantaneousMagneticTripA": 1700,
      "currentLimiting": false
    },
    "notes": [
      "Use the interrupting rating at the applicable connected AC voltage; do not combine the 600 V maximum with the 240 V interrupting value.",
      "The magnetic hold/trip band is not total clearing time. Interrupting capacity is not downstream assembly SCCR or peak let-through."
    ],
    "missing": [
      "total clearing time at study fault current",
      "peak let-through at study fault current",
      "installed accessory/suffix configuration"
    ]
  },
  {
    "id": "CURATED-BRK-SE-HJL36100",
    "kind": "switchgear",
    "equipmentType": "breaker",
    "manufacturer": "Schneider Electric / Square D",
    "model": "HJL36100",
    "title": "Square D PowerPacT HJL36100 — 100 A, three-pole, J interrupting level",
    "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/GeneralInforamtion3-6D3FBC55",
    "supportingSources": [
      {
        "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/CircuitBreakers2-6D40FD79",
        "page": "H-Frame Standard (80%) Rated 150 A Unit-Mount Thermal-Magnetic Circuit Breakers; three-pole 600 Vac 50/60 Hz table; 100 A row"
      }
    ],
    "page": "Interrupting Rating table, J level, UL/CSA/NOM columns; SKU identified in supporting 100 A row",
    "checkedAt": "2026-10-18",
    "sourceRevision": "0611CT1001 public manufacturer web catalogue; page revision/date not stated",
    "values": {
      "ratedVoltage": 600,
      "continuousA": 100
    },
    "ratings": [
      {
        "system": "AC",
        "voltage": 240,
        "interruptA": 100000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      },
      {
        "system": "AC",
        "voltage": 480,
        "interruptA": 65000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      },
      {
        "system": "AC",
        "voltage": 600,
        "interruptA": 25000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      }
    ],
    "referenceOnlyFields": {
      "poles": 3,
      "frameA": 150,
      "tripType": "thermal-magnetic",
      "continuousLoadingBasis": "standard 80%-rated breaker; not 100%-rated configuration",
      "frequencyHz": [
        50,
        60
      ],
      "instantaneousMagneticHoldA": 900,
      "instantaneousMagneticTripA": 1700,
      "currentLimiting": true
    },
    "notes": [
      "Use the interrupting rating at the applicable connected AC voltage; do not combine the 600 V maximum with the 240 V interrupting value.",
      "The magnetic hold/trip band is not total clearing time. Interrupting capacity is not downstream assembly SCCR or peak let-through."
    ],
    "missing": [
      "total clearing time at study fault current",
      "peak let-through at study fault current",
      "installed accessory/suffix configuration"
    ]
  },
  {
    "id": "CURATED-BRK-SE-HLL36100",
    "kind": "switchgear",
    "equipmentType": "breaker",
    "manufacturer": "Schneider Electric / Square D",
    "model": "HLL36100",
    "title": "Square D PowerPacT HLL36100 — 100 A, three-pole, L interrupting level",
    "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/GeneralInforamtion3-6D3FBC55",
    "supportingSources": [
      {
        "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/CircuitBreakers2-6D40FD79",
        "page": "H-Frame Standard (80%) Rated 150 A Unit-Mount Thermal-Magnetic Circuit Breakers; three-pole 600 Vac 50/60 Hz table; 100 A row"
      }
    ],
    "page": "Interrupting Rating table, L level, UL/CSA/NOM columns; SKU identified in supporting 100 A row",
    "checkedAt": "2026-10-18",
    "sourceRevision": "0611CT1001 public manufacturer web catalogue; page revision/date not stated",
    "values": {
      "ratedVoltage": 600,
      "continuousA": 100
    },
    "ratings": [
      {
        "system": "AC",
        "voltage": 240,
        "interruptA": 125000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      },
      {
        "system": "AC",
        "voltage": 480,
        "interruptA": 100000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      },
      {
        "system": "AC",
        "voltage": 600,
        "interruptA": 50000,
        "standard": "UL/CSA/NOM",
        "basis": "RMS symmetrical interrupting current"
      }
    ],
    "referenceOnlyFields": {
      "poles": 3,
      "frameA": 150,
      "tripType": "thermal-magnetic",
      "continuousLoadingBasis": "standard 80%-rated breaker; not 100%-rated configuration",
      "frequencyHz": [
        50,
        60
      ],
      "instantaneousMagneticHoldA": 900,
      "instantaneousMagneticTripA": 1700,
      "currentLimiting": true
    },
    "notes": [
      "Use the interrupting rating at the applicable connected AC voltage; do not combine the 600 V maximum with the 240 V interrupting value.",
      "The magnetic hold/trip band is not total clearing time. Interrupting capacity is not downstream assembly SCCR or peak let-through."
    ],
    "missing": [
      "total clearing time at study fault current",
      "peak let-through at study fault current",
      "installed accessory/suffix configuration"
    ]
  },
  {
    "id": "CURATED-CABLE-SOUTHWIRE-664694",
    "kind": "cable",
    "manufacturer": "Southwire",
    "model": "664694 — SPEC 45412",
    "title": "Southwire high-flex copper PV/RHW-2 — 8 AWG, 2000 V, 49 strands, black",
    "sourceUrl": "https://cabletechsupport.southwire.com/en/tile/26/spec/45412/?country=US",
    "page": "Table 1 and Table 2, stock 664694; electrical table units and reactance footnote; Stock Code Colors",
    "checkedAt": "2026-10-18",
    "sourceRevision": "Revision 1.000.009; updated June 12, 2025, 14:28 UTC",
    "values": {
      "ratedVoltage": 2000,
      "frequency": 60,
      "rPerM": 0.002769028871391076,
      "xPerM": 0.0001706036745406824,
      "material": "Copper",
      "size": "8 AWG",
      "temperature": 75,
      "insulationType": "PV wire / RHW-2 XLPE",
      "insulationProductTemp": 90,
      "cableCategory": "pv",
      "cableType": "Southwire SPEC 45412 / stock 664694; 49 strands; non-ferrous conduit, one diameter spacing"
    },
    "ratings": [],
    "referenceOnlyFields": {
      "sourceAcResistanceOhmPer1000FtAt75C": 0.844,
      "sourceInductiveReactanceOhmPer1000FtAt60Hz": 0.052,
      "sourceDcResistanceOhmPer1000FtAt25C": 0.701,
      "strandCount": 49,
      "insulationColor": "black",
      "approximateOutsideDiameterIn": 0.326,
      "insulationChemistry": "XLPE",
      "insulationMarkings": "PV wire / RHW-2, 2000 V",
      "normalTemperatureWetDryC": 90,
      "emergencyTemperatureC": 130,
      "shortCircuitTemperatureC": 250,
      "referenceAmpacity75C_A": 50,
      "referenceAmpacity90C_A": 55,
      "ampacityBasis": "2023 NEC Table 310.16; installation/termination adjustments required",
      "reactanceInstallationBasis": "non-ferrous conduit; one diameter spacing center-to-center",
      "dcOnlyFields": [
        "sourceDcResistanceOhmPer1000FtAt25C"
      ]
    },
    "notes": [
      "AC R at 75 C and 60 Hz X are separately converted from ohm/1000 ft by dividing by exactly 304.8; DC R at 25 C is reference-only.",
      "The impedance requires matching installed routing; verify exact stock/stranding/markings. Ampacity values are references and do not certify installation ampacity."
    ],
    "missing": [
      "R0",
      "X0",
      "impedance for other routing/spacing",
      "installed product and marking confirmation"
    ]
  },
  {
    "id": "CURATED-CABLE-SOUTHWIRE-458007",
    "kind": "cable",
    "manufacturer": "Southwire",
    "model": "458007 — SPEC 45412",
    "title": "Southwire high-flex copper PV/RHW-2 — 6 AWG, 2000 V, 49 strands, red",
    "sourceUrl": "https://cabletechsupport.southwire.com/en/tile/26/spec/45412/?country=US",
    "page": "Table 1 and Table 2, stock 458007; electrical table units and reactance footnote; Stock Code Colors",
    "checkedAt": "2026-10-18",
    "sourceRevision": "Revision 1.000.009; updated June 12, 2025, 14:28 UTC",
    "values": {
      "ratedVoltage": 2000,
      "frequency": 60,
      "rPerM": 0.0017585301837270341,
      "xPerM": 0.00016732283464566928,
      "material": "Copper",
      "size": "6 AWG",
      "temperature": 75,
      "insulationType": "PV wire / RHW-2 XLPE",
      "insulationProductTemp": 90,
      "cableCategory": "pv",
      "cableType": "Southwire SPEC 45412 / stock 458007; 49 strands; non-ferrous conduit, one diameter spacing"
    },
    "ratings": [],
    "referenceOnlyFields": {
      "sourceAcResistanceOhmPer1000FtAt75C": 0.536,
      "sourceInductiveReactanceOhmPer1000FtAt60Hz": 0.051,
      "sourceDcResistanceOhmPer1000FtAt25C": 0.446,
      "strandCount": 49,
      "insulationColor": "red",
      "approximateOutsideDiameterIn": 0.359,
      "insulationChemistry": "XLPE",
      "insulationMarkings": "PV wire / RHW-2, 2000 V",
      "normalTemperatureWetDryC": 90,
      "emergencyTemperatureC": 130,
      "shortCircuitTemperatureC": 250,
      "referenceAmpacity75C_A": 65,
      "referenceAmpacity90C_A": 75,
      "ampacityBasis": "2023 NEC Table 310.16; installation/termination adjustments required",
      "reactanceInstallationBasis": "non-ferrous conduit; one diameter spacing center-to-center",
      "dcOnlyFields": [
        "sourceDcResistanceOhmPer1000FtAt25C"
      ]
    },
    "notes": [
      "AC R at 75 C and 60 Hz X are separately converted from ohm/1000 ft by dividing by exactly 304.8; DC R at 25 C is reference-only.",
      "The impedance requires matching installed routing; verify exact stock/stranding/markings. Ampacity values are references and do not certify installation ampacity."
    ],
    "missing": [
      "R0",
      "X0",
      "impedance for other routing/spacing",
      "installed product and marking confirmation"
    ]
  },
  {
    "id": "CURATED-CABLE-SOUTHWIRE-668079",
    "kind": "cable",
    "manufacturer": "Southwire",
    "model": "668079 — SPEC 45412",
    "title": "Southwire high-flex copper PV/RHW-2 — 6 AWG, 2000 V, 133 strands, black",
    "sourceUrl": "https://cabletechsupport.southwire.com/en/tile/26/spec/45412/?country=US",
    "page": "Table 1 and Table 2, stock 668079; electrical table units and reactance footnote; Stock Code Colors",
    "checkedAt": "2026-10-18",
    "sourceRevision": "Revision 1.000.009; updated June 12, 2025, 14:28 UTC",
    "values": {
      "ratedVoltage": 2000,
      "frequency": 60,
      "rPerM": 0.0017585301837270341,
      "xPerM": 0.00016732283464566928,
      "material": "Copper",
      "size": "6 AWG",
      "temperature": 75,
      "insulationType": "PV wire / RHW-2 XLPE",
      "insulationProductTemp": 90,
      "cableCategory": "pv",
      "cableType": "Southwire SPEC 45412 / stock 668079; 133 strands; non-ferrous conduit, one diameter spacing"
    },
    "ratings": [],
    "referenceOnlyFields": {
      "sourceAcResistanceOhmPer1000FtAt75C": 0.536,
      "sourceInductiveReactanceOhmPer1000FtAt60Hz": 0.051,
      "sourceDcResistanceOhmPer1000FtAt25C": 0.446,
      "strandCount": 133,
      "insulationColor": "black",
      "approximateOutsideDiameterIn": 0.36,
      "insulationChemistry": "XLPE",
      "insulationMarkings": "PV wire / RHW-2, 2000 V",
      "normalTemperatureWetDryC": 90,
      "emergencyTemperatureC": 130,
      "shortCircuitTemperatureC": 250,
      "referenceAmpacity75C_A": 65,
      "referenceAmpacity90C_A": 75,
      "ampacityBasis": "2023 NEC Table 310.16; installation/termination adjustments required",
      "reactanceInstallationBasis": "non-ferrous conduit; one diameter spacing center-to-center",
      "dcOnlyFields": [
        "sourceDcResistanceOhmPer1000FtAt25C"
      ]
    },
    "notes": [
      "AC R at 75 C and 60 Hz X are separately converted from ohm/1000 ft by dividing by exactly 304.8; DC R at 25 C is reference-only.",
      "The impedance requires matching installed routing; verify exact stock/stranding/markings. Ampacity values are references and do not certify installation ampacity."
    ],
    "missing": [
      "R0",
      "X0",
      "impedance for other routing/spacing",
      "installed product and marking confirmation"
    ]
  }
];
