# V29d: engineering master database v13 import

Source: github.com/classroomsolar/engineering-master-database, `02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx` (Library master version 13, SHA-256 dcef1fb4a8b00edbfb5e420dc4e76e6f4a8975cd0599e2f3c7902c4ee44f9f52). Read only; nothing was written to that repository.

Previous calculator import: 19 Oct 2026, 93 sheets, workbook SHA-256 cab11d2c….

## Method
- Every sheet read with cached cell values (formulas not recalculated), written as gzip JSON in the same schema the site already reads (`database/master-*.json.txt`).
- Equipment pickers rebuilt with the same selection rules as before. The rules were first checked on the old data: they reproduce all 13 old picker files exactly, record for record.
- 21 `CEC_*` sheets (listing memberships, archives, provenance ledgers) left out: in v13 they are provenance, not a separate catalogue, and PV_MODULES / IBR already carry those records. Leaving them out keeps the site at 12.5 MiB (Wix limit 20 MiB).
- Saved studies are not affected: each applied record keeps its own snapshot of the values used.
- Embedded table `groundingResistors` (neutral-grounding resistors) updated from 4 to 88 records, in `database-reference-tables.mjs` and in the bundle.

## Equipment pickers (records offered / total in sheet)

| Sheet | Before | After |
|---|---|---|
| CABLES | 10,390 / 10,621 | 10,883 / 13,223 |
| CABLE_IMPEDANCE_DEFAULTS | 9 / 9 | 9 / 9 |
| TRANSFORMERS | 367 / 367 | 1,201 / 1,201 |
| IBR | 445 / 445 | 5,603 / 5,603 |
| GENERATORS | 3 / 3 | 17 / 17 |
| HV_BREAKERS | 3,232 / 3,241 | 3,296 / 3,305 |
| LV_BREAKERS | 18 / 50,524 | 18 / 50,524 |
| SWITCHGEAR | 15 / 15 | 114 / 114 |
| MOTORS_NAMEPLATE | 410 / 410 | 1,162 / 1,162 |
| FUSES | 3 / 21,823 | 451 / 22,271 |
| RECLOSERS | 2 / 3,247 | 22 / 3,267 |
| DISCONNECTS | 20 / 20 | 186 / 186 |
| PV_MODULES | 25,882 / 25,882 | 39,400 / 39,400 |

Records with complete fault-study data (directly usable without extra input): transformers 11 → 11 (the 834 new transformer records lack %Z), IBR 19 → 61, generators 3 → 10, switchgear 8 → 16, fuses 3 → 7, reclosers 2 → 22. The rest are offered as references; missing values are never filled in.

LV breakers, most fuses, relays, trip devices and overload heaters stay limited: in v13 they are "ETAP-protected; catalog metadata decoded" records without ratings or curves. **No time-current curves are in the database**, so clearing times come from the relay-curve / manufacturer-curve dropdowns added in V29d.

## All sheets (rows before → after)

| Sheet | Before | v13 |
|---|---|---|
| CABLES | 10621 | 13223 |
| CABLE_TYPES | 797 | 797 |
| TRANSMISSION_CONDUCTORS | 1610 | 1610 |
| PV_MODULES | 25882 | 39400 |
| BATTERIES | 281 | 865 |
| BATTERY_PERFORMANCE | 10532 | 10532 |
| TRANSFORMERS | 367 | 1201 |
| MOTORS_NAMEPLATE | 410 | 1162 |
| MOTOR_CHARACTERISTICS | 2040 | 2040 |
| MOTOR_MODELS | 186 | 186 |
| HV_BREAKERS | 3241 | 3305 |
| HV_BREAKERS_EXTENDED | 3476 | 3476 |
| LV_BREAKERS | 50524 | 50524 |
| FUSES | 21823 | 22271 |
| RELAYS | 8900 | 8914 |
| RECLOSERS | 3247 | 3267 |
| TRIP_DEVICES | 17889 | 17889 |
| OVERLOAD_HEATERS | 5776 | 5776 |
| ELECTRONIC_CONTROLLERS | 1118 | 1709 |
| CSD_DEVICES | 2575 | 2575 |
| RELIABILITY | 98 | 98 |
| RELIABILITY_EXTENDED | 141 | 141 |
| FIRE_PROTECTION | 25 | 25 |
| CONDUIT_FIRE_PROTECTION | 7 | 7 |
| HARMONICS | 445 | 445 |
| RECTIFIERS | 4 | 379 |
| INTERRUPTION_COST | 30 | 30 |
| RAILWAY_LOADS | 7 | 7 |
| IBR | 445 | 5603 |
| SWITCHGEAR | 15 | 114 |
| INSTRUMENT_TRANSFORMERS | 44 | 546 |
| DISCONNECTS | 20 | 186 |
| CONDUCTOR_MATERIALS | 2 | 2 |
| CONDUCTOR_SIZES | 30 | 30 |
| CABLE_SC_K_FACTORS | 8 | 8 |
| INSULATION_CLASSES | 5 | 5 |
| GROUND_ELECTRODES | 41 | 109 |
| NEUTRAL_GROUNDING_RESISTORS | 4 | 88 |
| SURGE_ARRESTERS | 47 | 103 |
| CABLE_TRAYS | 39 | 95 |
| CABLE_CLEATS | 54 | 152 |
| BOX_FILL | 7 | 7 |
| CONDUITS | 24 | 24 |
| ENCLOSURES | 15 | 156 |
| PROTECTION_CURVES | 5 | 5 |
| SOURCE_REGISTER | 835 | 2313 |
| TERMINATIONS | 25 | 1000 |
| AMPACITY_ROUTES | 28 | 28 |
| AMPACITY_AMBIENT_FACTORS | 15 | 15 |
| AMPACITY_CCC_FACTORS | 7 | 7 |
| AMPACITY_PARAMETERS | 14 | 14 |
| NEC_AMPACITY_2020 | 1524 | 1524 |
| NEC_AMPACITY_2023 | 1524 | 1524 |
| GENERATORS | 3 | 17 |
| MOTOR_LOCKED_ROTOR_CODES | 19 | 19 |
| CABLE_FAULT_CURRENT_REFERENCE | 21 | 21 |
| CABLE_TRAY_EQUIPMENT | 59 | 124 |
| TRAY_EXPANSION_RULES | 13 | 13 |
| CABLE_CLEAT_SIZES | 123 | 123 |
| CABLE_CLEAT_SIZE_MAP | 722 | 722 |
| TRAY_ACCESSORY_RULES | 53 | 53 |
| CABLE_PLANNING_DEFAULTS | 10 | 10 |
| NEC_TRAY_FILL | 24 | 24 |
| NEC_CHANNEL_TRAY_FILL | 6 | 6 |
| TRAY_ENGINEERING_DEFAULTS | 5 | 5 |
| CABLE_IMPEDANCE_DEFAULTS | 9 | 9 |
| TRAY_EGC_METAL_AREA | 9 | 9 |
| EGC_SIZE_BY_OCPD | 21 | 21 |
| EGC_SIZE_THRESHOLDS | 21 | 21 |
| TRAY_EGC_AREA_THRESHOLDS | 10 | 10 |
| TRAY_WIDTH_CODES | 7 | 7 |
| TRAY_BARRIER_COVER_CODES | 4 | 4 |
| TRAY_GROUNDING_ACCESSORIES | 14 | 14 |
| PARTS_CATALOG | 744 | 744 |
| BREAKER_LUGS | 412 | 412 |
| PV_OPTIMIZERS | 36 | 48 |
| CONDUCTOR_PROPERTIES | 25 | 25 |
| LEGACY_NEC_REFERENCE | 2189 | 2189 |
| SHEET_MAP | 93 | 117 |
| FIELD_AUDIT | 1108 | 1643 |
| DATA_ISSUES | 3483 | 3593 |
| RESEARCH_GUIDANCE | 24 | 24 |
| MODEL_REQUIREMENTS | 63 | 63 |
| PV_UNIT_REVIEW | 25882 | 39400 |
| PLUGIN_LOG | 29 | 42 |
| CHANGE_LOG | 12393 | 23641 |
| AUDIT_README | 27 | 51 |
| OPTIMIZER_REVIEW | 36 | 36 |
| DATABASE_TABLE_INDEX | 78 | 116 |
| PAPER_AUDIT | 106 | 106 |
| CALCULATOR_KEY_AUDIT | 78 | 78 |
| CABLE_NORMALIZATION | 10621 | 10621 |
| NUMERIC_BENCHMARKS | 5 | 5 |
| REQUEST_AUDIT | new | 18 |
| EQUIPMENT_RECORD_HISTORY | new | 33 |
| RECORD_RECONCILIATION | new | 110 |

## Status on the live site
The files are in this package (`SITE/database/`) and tested in Chrome (all 96 sheets and 13 pickers load through the site's own validators, 0 errors). They are **not yet on the live site**: ~10 MB of compressed files could not be sent through the Wix connection available to the assistant. Run `DEPLOY/deploy_database_to_wix.py` (instructions inside; it checks the live site first and verifies every file after upload).
