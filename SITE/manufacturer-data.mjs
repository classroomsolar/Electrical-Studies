// Curated public manufacturer references. The original engineering workbook is retained unchanged.
export const manufacturerRecords = [
  {
    "id": "CURATED-TX-SE-EXN45T3H",
    "kind": "transformer",
    "manufacturer": "Schneider Electric / Square D",
    "model": "EXN45T3H",
    "title": "Square D EXN45T3H — 45 kVA, 480 delta / 208Y/120 V",
    "sourceUrl": "https://productinfo.se.com/nadigest/5c51d645347bdf0001f1f280/Master/17714_MAIN%20(bookmap)_0000061044.xml/$/DOE-2016-EE-Three-Phase-Transformers-EXN-EX",
    "page": "EXN & EX Three-Phase 60 Hz, 208Y/120 Vac Secondary; 480 Vac Delta Primary, Aluminum Windings table",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Revision/date not stated on public web table; checked 2026-10-10",
    "values": {
      "v1": 480,
      "v2": 208,
      "power": 45000,
      "zPercent": 4.1,
      "frequency": 60
    },
    "ratings": [],
    "referenceOnlyFields": {
      "phases": 3,
      "primaryConnection": "delta",
      "secondaryConnection": "wye",
      "secondaryLineNeutralV": 120,
      "windingMaterial": "aluminum",
      "temperatureRiseC": 150,
      "insulationClassC": 220,
      "zQualification": "Manufacturer nominal catalogue %IZ; installed nameplate/test impedance has not been confirmed"
    },
    "notes": [
      "Public manufacturer catalogue nominal impedance only; do not set installed/nameplate-confirmed flag.",
      "X/R and secondary grounding are absent from this table; retain explicit user input and its own provenance rather than labeling a default manufacturer data."
    ],
    "missing": [
      "X/R",
      "positive-sequence winding resistance",
      "installed/nameplate-confirmed impedance",
      "secondary neutral grounding arrangement"
    ]
  },
  {
    "id": "CURATED-TX-SE-EXN75T3H",
    "kind": "transformer",
    "manufacturer": "Schneider Electric / Square D",
    "model": "EXN75T3H",
    "title": "Square D EXN75T3H — 75 kVA, 480 delta / 208Y/120 V",
    "sourceUrl": "https://productinfo.se.com/nadigest/5c51d645347bdf0001f1f280/Master/17714_MAIN%20(bookmap)_0000061044.xml/$/DOE-2016-EE-Three-Phase-Transformers-EXN-EX",
    "page": "EXN & EX Three-Phase 60 Hz, 208Y/120 Vac Secondary; 480 Vac Delta Primary, Aluminum Windings table",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Revision/date not stated on public web table; checked 2026-10-10",
    "values": {
      "v1": 480,
      "v2": 208,
      "power": 75000,
      "zPercent": 4.9,
      "frequency": 60
    },
    "ratings": [],
    "referenceOnlyFields": {
      "phases": 3,
      "primaryConnection": "delta",
      "secondaryConnection": "wye",
      "secondaryLineNeutralV": 120,
      "windingMaterial": "aluminum",
      "temperatureRiseC": 150,
      "insulationClassC": 220,
      "zQualification": "Manufacturer nominal catalogue %IZ; installed nameplate/test impedance has not been confirmed"
    },
    "notes": [
      "Public manufacturer catalogue nominal impedance only; do not set installed/nameplate-confirmed flag.",
      "X/R and secondary grounding are absent from this table; retain explicit user input and its own provenance rather than labeling a default manufacturer data."
    ],
    "missing": [
      "X/R",
      "positive-sequence winding resistance",
      "installed/nameplate-confirmed impedance",
      "secondary neutral grounding arrangement"
    ]
  },
  {
    "id": "CURATED-TX-SE-EXN150T3H",
    "kind": "transformer",
    "manufacturer": "Schneider Electric / Square D",
    "model": "EXN150T3H",
    "title": "Square D EXN150T3H — 150 kVA, 480 delta / 208Y/120 V",
    "sourceUrl": "https://productinfo.se.com/nadigest/5c51d645347bdf0001f1f280/Master/17714_MAIN%20(bookmap)_0000061044.xml/$/DOE-2016-EE-Three-Phase-Transformers-EXN-EX",
    "page": "EXN & EX Three-Phase 60 Hz, 208Y/120 Vac Secondary; 480 Vac Delta Primary, Aluminum Windings table",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Revision/date not stated on public web table; checked 2026-10-10",
    "values": {
      "v1": 480,
      "v2": 208,
      "power": 150000,
      "zPercent": 3.1,
      "frequency": 60
    },
    "ratings": [],
    "referenceOnlyFields": {
      "phases": 3,
      "primaryConnection": "delta",
      "secondaryConnection": "wye",
      "secondaryLineNeutralV": 120,
      "windingMaterial": "aluminum",
      "temperatureRiseC": 150,
      "insulationClassC": 220,
      "zQualification": "Manufacturer nominal catalogue %IZ; installed nameplate/test impedance has not been confirmed"
    },
    "notes": [
      "Public manufacturer catalogue nominal impedance only; do not set installed/nameplate-confirmed flag.",
      "X/R and secondary grounding are absent from this table; retain explicit user input and its own provenance rather than labeling a default manufacturer data."
    ],
    "missing": [
      "X/R",
      "positive-sequence winding resistance",
      "installed/nameplate-confirmed impedance",
      "secondary neutral grounding arrangement"
    ]
  },
  {
    "id": "CURATED-GEN-STAMFORD-HCI434F-311-480-60",
    "kind": "generator",
    "manufacturer": "STAMFORD / Cummins Generator Technologies",
    "model": "HCI434F/444F, winding 311, series star, 480/277 V, 60 Hz",
    "title": "STAMFORD HCI434F winding 311 — 480 V / 500 kVA reactance base",
    "sourceUrl": "https://www.stamford-avk.com/sites/stamfordavk/files/HCI4F-311-TD-EN_Rev_A.pdf",
    "page": "PDF page 3: reactance table; PDF page 8: continuous H rating",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Rev A; document footer HC4F-311-TD-EN-SG-A; copyright 2010 (legacy document, not a 2025 revision)",
    "values": {
      "voltage": 480,
      "power": 500000,
      "frequency": 60,
      "xdpp": 0.11,
      "xdp": 0.15,
      "xd": 2.71
    },
    "ratings": [],
    "referenceOnlyFields": {
      "reactanceBaseVA": 500000,
      "reactanceBaseV": 480,
      "reactancesSaturated": true,
      "winding": 311,
      "connection": "series star",
      "negativeSequenceX2Pu": 0.24,
      "zeroSequenceX0Pu": 0.08,
      "statorResistanceOhmPerPhaseAt22C": 0.0073,
      "transientTimeConstantS": 0.08,
      "subtransientTimeConstantS": 0.019,
      "openCircuitTimeConstantS": 1.7,
      "armatureTimeConstantS": 0.018,
      "ratedPowerFactor": 0.8,
      "continuousH125Rise40AmbientKVA": 500
    },
    "notes": [
      "Reactances are per-unit saturated values on the indicated 500 kVA / 480 V / 60 Hz base. Confirm exact installed winding and alternator before use.",
      "AS440 self-excited option does not sustain a short circuit; PMG MX321/MX341 has a separate decrement curve. Do not infer a constant sustained contribution from Xd-double-prime.",
      "Do not treat 22 C DC stator resistance as a published effective fault X/R."
    ],
    "missing": [
      "published effective fault X/R",
      "installed AVR/excitation selection",
      "actual genset nameplate rating if different from alternator base"
    ]
  },
  {
    "id": "CURATED-FUSE-EATON-FRS-R-100",
    "kind": "switchgear",
    "equipmentType": "fuse",
    "manufacturer": "Eaton Bussmann",
    "model": "FRS-R-100",
    "title": "Eaton Bussmann FRS-R-100 — 100 A Class RK5",
    "sourceUrl": "https://www.eaton.com/us/en-us/skuPage.FRS-R-100.html",
    "page": "Electrical rating / General information",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Web revision/date not stated; checked 2026-10-10",
    "values": {
      "continuousA": 100,
      "ratedVoltage": 600
    },
    "ratings": [
      {
        "voltage": 600,
        "system": "AC",
        "interruptA": 200000,
        "basis": "RMS symmetrical / AC kAIC"
      },
      {
        "voltage": 300,
        "system": "DC",
        "interruptA": 20000,
        "referenceOnly": true
      }
    ],
    "referenceOnlyFields": {
      "fuseClass": "RK5",
      "responseType": "time-delay, dual-element, current limiting"
    },
    "notes": [
      "AC and DC interrupting ratings are separate; DC rating is reference only for this three-phase AC engine.",
      "Use the manufacturer total-clearing TCC and actual study current/settings for clearing time. The interrupting rating is not clearing time or downstream equipment SCCR."
    ],
    "missing": [
      "total clearing time at study current",
      "peak let-through at study current",
      "TCC curve identifier/point data"
    ]
  },
  {
    "id": "CURATED-FUSE-EATON-JKS-100",
    "kind": "switchgear",
    "equipmentType": "fuse",
    "manufacturer": "Eaton Bussmann",
    "model": "JKS-100",
    "title": "Eaton Bussmann JKS-100 — 100 A Class J",
    "sourceUrl": "https://www.eaton.com/us/en-us/skuPage.JKS-100.html",
    "page": "Electrical rating / General information",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Web revision/date not stated; checked 2026-10-10",
    "values": {
      "continuousA": 100,
      "ratedVoltage": 600
    },
    "ratings": [
      {
        "voltage": 600,
        "system": "AC",
        "interruptA": 200000,
        "basis": "RMS symmetrical / AC kAIC"
      }
    ],
    "referenceOnlyFields": {
      "fuseClass": "J",
      "responseType": "fast-acting, current limiting"
    },
    "notes": [
      "AC and DC interrupting ratings are separate; DC rating is reference only for this three-phase AC engine.",
      "Use the manufacturer total-clearing TCC and actual study current/settings for clearing time. The interrupting rating is not clearing time or downstream equipment SCCR."
    ],
    "missing": [
      "total clearing time at study current",
      "peak let-through at study current",
      "TCC curve identifier/point data"
    ]
  },
  {
    "id": "CURATED-FUSE-EATON-DFJ-150",
    "kind": "switchgear",
    "equipmentType": "fuse",
    "manufacturer": "Eaton Bussmann",
    "model": "DFJ-150",
    "title": "Eaton Bussmann DFJ-150 — 150 A Class J",
    "sourceUrl": "https://www.eaton.com/us/en-us/skuPage.DFJ-150.html",
    "page": "Electrical rating / General information",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Web revision/date not stated; checked 2026-10-10",
    "values": {
      "continuousA": 150,
      "ratedVoltage": 600
    },
    "ratings": [
      {
        "voltage": 600,
        "system": "AC",
        "interruptA": 200000,
        "basis": "RMS symmetrical / AC kAIC"
      },
      {
        "voltage": 450,
        "system": "DC",
        "interruptA": 100000,
        "referenceOnly": true
      }
    ],
    "referenceOnlyFields": {
      "fuseClass": "J",
      "responseType": "high speed"
    },
    "notes": [
      "AC and DC interrupting ratings are separate; DC rating is reference only for this three-phase AC engine.",
      "Use the manufacturer total-clearing TCC and actual study current/settings for clearing time. The interrupting rating is not clearing time or downstream equipment SCCR."
    ],
    "missing": [
      "total clearing time at study current",
      "peak let-through at study current",
      "TCC curve identifier/point data"
    ]
  },
  {
    "id": "CURATED-REC-SC-248122R1",
    "kind": "switchgear",
    "equipmentType": "recloser",
    "manufacturer": "S&C Electric",
    "model": "248122R1",
    "title": "S&C IntelliRupter 248122R1 — disconnect style, 15.5 kV",
    "sourceUrl": "https://www.sandc.com/globalassets/sac-electric/documents/public---documents/sales-manual-library---external-view/specification-bulletin-766-31.pdf",
    "page": "PDF page 14 (printed page 14), Table 2; PDF page 26, Table 15",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Specification Bulletin 766-31, June 1, 2026",
    "values": {
      "ratedVoltage": 15500,
      "continuousA": 800
    },
    "ratings": [
      {
        "voltage": 15500,
        "system": "AC",
        "interruptA": 16000,
        "basis": "Short-circuit breaking and making symmetrical RMS"
      }
    ],
    "referenceOnlyFields": {
      "style": "upright-crossarm disconnect",
      "bilV": 110000,
      "windQualifiedContinuousA": 900,
      "windCondition": "minimum wind velocity 2 ft/sec",
      "controlPower": "Required ordered option: integral power module(s) or external supply"
    },
    "notes": [
      "Use 800 A as normal continuous rating; 900 A is wind-qualified and must not replace it unconditionally.",
      "Control options and curve settings determine operating time. Integral power modules have grounding/application limits; do not infer suitability for an ungrounded delta system from voltage class alone."
    ],
    "missing": [
      "actual protection/control settings",
      "clearing time at study current",
      "exact control-power suffix",
      "numeric peak making rating in this selected table"
    ]
  },
  {
    "id": "CURATED-REC-SC-248123R1",
    "kind": "switchgear",
    "equipmentType": "recloser",
    "manufacturer": "S&C Electric",
    "model": "248123R1",
    "title": "S&C IntelliRupter 248123R1 — disconnect style, 27 kV",
    "sourceUrl": "https://www.sandc.com/globalassets/sac-electric/documents/public---documents/sales-manual-library---external-view/specification-bulletin-766-31.pdf",
    "page": "PDF page 14 (printed page 14), Table 2; PDF page 26, Table 15",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Specification Bulletin 766-31, June 1, 2026",
    "values": {
      "ratedVoltage": 27000,
      "continuousA": 800
    },
    "ratings": [
      {
        "voltage": 27000,
        "system": "AC",
        "interruptA": 12500,
        "basis": "Short-circuit breaking and making symmetrical RMS"
      }
    ],
    "referenceOnlyFields": {
      "style": "upright-crossarm disconnect",
      "bilV": 125000,
      "windQualifiedContinuousA": 900,
      "windCondition": "minimum wind velocity 2 ft/sec",
      "controlPower": "Required ordered option: integral power module(s) or external supply"
    },
    "notes": [
      "Use 800 A as normal continuous rating; 900 A is wind-qualified and must not replace it unconditionally.",
      "Control options and curve settings determine operating time. Integral power modules have grounding/application limits; do not infer suitability for an ungrounded delta system from voltage class alone."
    ],
    "missing": [
      "actual protection/control settings",
      "clearing time at study current",
      "exact control-power suffix",
      "numeric peak making rating in this selected table"
    ]
  },
  {
    "id": "CURATED-PANEL-EATON-PRL2X3225X42CS",
    "kind": "panel",
    "equipmentType": "panelboard",
    "manufacturer": "Eaton",
    "model": "PRL2X3225X42CS",
    "title": "Eaton PRL2X panelboard interior — 480Y/277 V, 225 A, 42 circuits",
    "sourceUrl": "https://www.eaton.com/us/en-us/skuPage.PRL2X3225X42CS.html",
    "page": "Product description / Physical Attributes / Performance Ratings",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Web revision/date not stated; checked 2026-10-10",
    "values": {
      "ratedVoltage": 480,
      "continuousA": 225,
      "sccrA": null
    },
    "ratings": [],
    "referenceOnlyFields": {
      "system": "AC",
      "phases": 3,
      "wires": 4,
      "lineNeutralVoltageV": 277,
      "busMaterial": "copper",
      "circuits": 42,
      "productType": "panelboard interior",
      "certification": "UL 67"
    },
    "notes": [
      "This is an interior rather than a complete panel assembly. Assembly SCCR requires actual main/branch devices, enclosure/nameplate, and any valid tested series combination.",
      "Do not assign the family maximum short-circuit rating to this SKU."
    ],
    "missing": [
      "complete assembly SCCR",
      "main/branch breaker models",
      "series-rating conditions",
      "complete enclosure configuration"
    ]
  },
  {
    "id": "CURATED-DISC-SE-H366NR",
    "kind": "disconnect",
    "equipmentType": "disconnect",
    "manufacturer": "Schneider Electric / Square D",
    "model": "H366NR",
    "title": "Square D H366NR fusible safety switch — 600 A, 600 V, NEMA 3R",
    "sourceUrl": "https://www.se.com/us/en/product/H366NR/safety-switch-heavy-duty-fusible-600a-4-wire-3-pole-1-neutral-500hp-600v-ac-dc-nema-3r/",
    "page": "Product title / Highlights",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Web revision/date not stated; checked 2026-10-10",
    "values": {
      "ratedVoltage": 600,
      "continuousA": 600,
      "sccrA": null
    },
    "ratings": [],
    "referenceOnlyFields": {
      "acVoltageRatingV": 600,
      "dcVoltageRatingV": 600,
      "poles": 3,
      "wires": 4,
      "factoryInstalledNeutral": true,
      "fusible": true,
      "enclosure": "NEMA 3R"
    },
    "notes": [
      "SCCR is conditional on installed fuses and certified switch wiring/nameplate. This public product overview supplies no unconditional assembly SCCR, so none is imported.",
      "The switch does not become a fault-interrupting circuit breaker; fuse function stays distinct."
    ],
    "missing": [
      "fuse model/class/rating",
      "certified conditional SCCR",
      "total fuse clearing time",
      "shunt-trip/control equipment configuration"
    ]
  },
  {
    "id": "CURATED-CABLE-SOUTHWIRE-668048",
    "kind": "cable",
    "manufacturer": "Southwire",
    "model": "668048 — SPEC 45412",
    "title": "Southwire high-flex copper PV/RHW-2 — 8 AWG, 2000 V, 54 strands",
    "sourceUrl": "https://cabletechsupport.southwire.com/en/tile/26/spec/45412/?country=US",
    "page": "Table 1 stock 668048; Table 2 stock 668048; footnotes",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Revision 1.000.009; updated June 12, 2025, 14:28 UTC",
    "values": {
      "ratedVoltage": 2000,
      "frequency": 60,
      "rPerM": 0.002683727034120735,
      "xPerM": 0.0001706036745406824,
      "material": "Copper",
      "size": "8 AWG",
      "temperature": 75
    },
    "ratings": [],
    "referenceOnlyFields": {
      "sourceAcResistanceOhmPer1000FtAt75C": 0.818,
      "sourceInductiveReactanceOhmPer1000FtAt60Hz": 0.052,
      "sourceDcResistanceOhmPer1000FtAt25C": 0.679,
      "strandCount": 54,
      "conductorDiameterIn": 0.145,
      "insulationThicknessMil": 85,
      "approximateOutsideDiameterIn": 0.326,
      "insulationChemistry": "XLPE",
      "insulationMarkings": "PV wire / RHW-2, 2000 V",
      "normalTemperatureWetDryC": 90,
      "emergencyTemperatureC": 130,
      "shortCircuitTemperatureC": 250,
      "referenceAmpacity75C_A": 50,
      "referenceAmpacity90C_A": 55,
      "ampacityBasis": "2023 NEC Table 310.16; installation/termination adjustment required",
      "reactanceInstallationBasis": "non-ferrous conduit; one diameter spacing center-to-center",
      "dcOnlyFields": [
        "sourceDcResistanceOhmPer1000FtAt25C"
      ]
    },
    "notes": [
      "AC R is specifically the 75 C column; X is specifically the 60 Hz column. DC R at 25 C is retained only as reference and never substituted for AC R.",
      "The table specifies flexible bare copper ASTM B3/B173 or flexible tinned copper ASTM B33. Do not silently merge this stock with other 8 AWG stranding or conduit layouts.",
      "Convert ohm/1000 ft to ohm/m by dividing by 304.8. Positive-sequence AC use requires matching physical routing; no R0/X0 supplied."
    ],
    "missing": [
      "R0",
      "X0",
      "impedance for other conductor routing/spacing",
      "installed product print/nameplate confirmation"
    ]
  },
  {
    "id": "CURATED-PV-LONGI-LR7-72HTH-620M",
    "kind": "reference",
    "equipmentType": "pv_module",
    "manufacturer": "LONGi",
    "model": "LR7-72HTH-620M",
    "title": "LONGi Hi-MO X6 Max Scientist LR7-72HTH-620M — DC reference",
    "sourceUrl": "https://www.longi.com/en/products/modules/hi-mo-x6-max-scientist/",
    "page": "Electrical Performance Parameters (STC Test) / Temperature Coefficient",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Public page revision/date not stated; checked 2026-10-10",
    "values": {},
    "ratings": [],
    "referenceOnlyFields": {
      "dcOnly": true,
      "stcPmaxW": 620,
      "stcVocV": 52.72,
      "stcIscA": 14.93,
      "stcVmpV": 44.48,
      "stcImpA": 13.94,
      "vocCoefficientPercentPerC": -0.23,
      "iscCoefficientPercentPerC": 0.05,
      "pmaxCoefficientPercentPerC": -0.29,
      "dimensionsMM": [
        2382,
        1134,
        30
      ],
      "massKg": 28.5
    },
    "notes": [
      "Reference-only module nameplate data; DC module Isc is not an inverter AC fault-current contribution.",
      "No DC network solver is introduced by this reference record."
    ],
    "missing": [
      "maximum DC system voltage on selected public table",
      "series-fuse rating on selected public table",
      "regional listing/certification for selected SKU",
      "any AC fault model"
    ],
    "referenceOnly": true
  },
  {
    "id": "CURATED-IBR-SMA-X70-70US-REFERENCE",
    "kind": "ibr",
    "manufacturer": "SMA",
    "model": "Sunny Tripower X 70 — 70-US variant (exact type suffix not verified)",
    "title": "SMA Sunny Tripower X 70 70-US — AC nameplate reference",
    "sourceUrl": "https://www.sma-america.com/products/solarinverters/sunny-tripower-x-70",
    "page": "Product overview / Benefits & Key Features",
    "checkedAt": "2026-10-10",
    "sourceRevision": "Public page revision/date not stated; checked 2026-10-10",
    "values": {},
    "ratings": [],
    "referenceOnlyFields": {
      "ratedAcActivePowerW": 70000,
      "nominalAcSystem": "277/480 V",
      "mpptTrackers": 5,
      "inputsPerMppt": 2,
      "integratedAcDisconnect": true,
      "integratedDcDisconnect": true,
      "acFaultDataAvailable": false,
      "nominalAcVoltageV": 480
    },
    "notes": [
      "Public page supplies real power and AC voltage; it supplies no exact short-circuit contribution/duration or tested apparent-power nameplate. Do not enter 70 kW as 70 kVA or derive a fault multiplier.",
      "Reference-only until exact SKU, data sheet and manufacturer AC short-circuit data are matched. Existing tested CORE1 or X 30 records must not be reused for X 70."
    ],
    "missing": [
      "exact type suffix",
      "rated apparent power VA",
      "rated AC current A",
      "initial/sustained/peak AC fault-current data",
      "fault duration and grid-code setting conditions"
    ],
    "referenceOnly": true
  },
  {
    "id": "CURATED-BRK-SE-HJA36100",
    "kind": "switchgear",
    "equipmentType": "breaker",
    "manufacturer": "Schneider Electric / Square D",
    "model": "HJA36100",
    "title": "Square D PowerPacT HJA36100 — 100 A, 3-pole thermal-magnetic",
    "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/GeneralInforamtion3-6D3FBC55",
    "supportingSources": [
      {
        "sourceUrl": "https://productinfo.se.com/0611ct1001_powerpact_hjl_cb_catalog/0611ct1001-powerpact-h-j-l-frame-circuit-breakers-catalog/English/0611CT1001%20PowerPact%20H-,%20J-,%20and%20L-Frame%20Circuit%20Breakers%20(bookmap)_0000105330.xml/$/CircuitBreakers2-6D40FD79",
        "page": "H-Frame, 150 A, Three-Pole, 600 Vac 50/60 Hz, 250 Vdc table"
      }
    ],
    "page": "Interrupting Rating table, J performance level; supporting SKU table identifies 100 A / 3-pole",
    "checkedAt": "2026-10-10",
    "sourceRevision": "0611CT1001 public web catalogue; page revision/date not stated; checked 2026-10-10",
    "values": {
      "ratedVoltage": 600,
      "continuousA": 100
    },
    "ratings": [
      {
        "system": "AC",
        "voltage": 240,
        "interruptA": 100000,
        "standard": "UL/CSA/NOM"
      },
      {
        "system": "AC",
        "voltage": 480,
        "interruptA": 65000,
        "standard": "UL/CSA/NOM"
      },
      {
        "system": "AC",
        "voltage": 600,
        "interruptA": 25000,
        "standard": "UL/CSA/NOM"
      },
      {
        "system": "DC",
        "voltage": 250,
        "interruptA": 20000,
        "referenceOnly": true
      }
    ],
    "referenceOnlyFields": {
      "poles": 3,
      "frameA": 150,
      "tripType": "thermal-magnetic",
      "frequencyHz": [
        50,
        60
      ],
      "instantaneousMagneticHoldA": 900,
      "instantaneousMagneticTripA": 1700,
      "currentLimiting": true
    },
    "notes": [
      "Select duty rating at the applicable voltage and standard: 65 kA at 480 Vac is not 65 kA at the 600 V maximum.",
      "If current UI can store only one interrupting number, do not combine 600 V with 65 kA; retain the voltage-rating table and require the appropriate selection.",
      "The 900/1700 A magnetic hold/trip bands are not total clearing time."
    ],
    "missing": [
      "total clearing time at fault study current",
      "peak let-through at study current",
      "installed accessory/suffix configuration"
    ]
  }
];
