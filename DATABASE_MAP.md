# DATABASE_MAP — what Fault Current Studio takes from the master database

Batch 1, 15 Nov 2026. Source: `classroomsolar/engineering-master-database` → `02_Engineering_Master_Database/Engineering_Master_Database_Audited.xlsx`, library master v13, SHA-256 `dcef1fb4a8b00edbfb5e420dc4e76e6f4a8975cd0599e2f3c7902c4ee44f9f52` (checksum verified 15 Nov 2026).

The package folder `SITE/database/` holds the prepared v13 import (not live, D-08): 111 files. It took 96 of 117 sheets; only the 21 `CEC_*` sheets were left out. Owner decision D-07: take only what this calculator needs.

How the site reads them: equipment pickers are listed in `database/manifest.json` (`network-app.mjs` loads it; `public-catalog-loader.mjs` serves the gzip `.json.txt` files). `master-*` files are read by the master library browser (`master-database.mjs`, `manufacturer-library.mjs`) and a few calculators (cable sizing).

## Keep — 65 files, 7.6 MB (gzip)

| File | Used for |
|---|---|
| `cable-picker.json.txt` | cable picker |
| `cable_impedance_defaults.json.txt` | cable R/X defaults |
| `cables.json.txt` | cable picker (records) |
| `disconnects.json.txt` | disconnect picker |
| `fuses.json.txt` | fuse picker |
| `generators.json.txt` | generator picker (D-04 keep) |
| `hv_breakers.json.txt` | MV breaker picker (filter to 35 kV class) |
| `ibr.json.txt` | inverter / BESS inverter picker |
| `lv_breakers.json.txt` | LV breaker picker |
| `manifest.json.txt` | picker index |
| `master-ampacity_ambient_factors.json.txt` | reference table: ampacity ambient factors |
| `master-ampacity_ccc_factors.json.txt` | reference table: ampacity ccc factors |
| `master-ampacity_parameters.json.txt` | reference table: ampacity parameters |
| `master-ampacity_routes.json.txt` | reference table: ampacity routes |
| `master-batteries.json.txt` | reference table: batteries (equipment ratings only, D-04) |
| `master-breaker_lugs.json.txt` | reference table: breaker lugs |
| `master-cable_fault_current_reference.json.txt` | reference table: cable fault current reference |
| `master-cable_impedance_defaults.json.txt` | reference table: cable impedance defaults |
| `master-cable_sc_k_factors.json.txt` | reference table: cable sc k factors |
| `master-cable_types.json.txt` | reference table: cable types |
| `master-cables.json.txt` | reference table: cables |
| `master-conductor_materials.json.txt` | reference table: conductor materials |
| `master-conductor_properties.json.txt` | reference table: conductor properties |
| `master-conductor_sizes.json.txt` | reference table: conductor sizes |
| `master-csd_devices.json.txt` | reference table: csd devices |
| `master-data_issues.json.txt` | reference table: data issues (provenance shown with records) |
| `master-database_table_index.json.txt` | reference table: database table index (provenance shown with records) |
| `master-disconnects.json.txt` | reference table: disconnects |
| `master-egc_size_by_ocpd.json.txt` | reference table: egc size by ocpd |
| `master-egc_size_thresholds.json.txt` | reference table: egc size thresholds |
| `master-electronic_controllers.json.txt` | reference table: electronic controllers |
| `master-fuses.json.txt` | reference table: fuses |
| `master-generators.json.txt` | reference table: generators |
| `master-harmonics.json.txt` | reference table: harmonics |
| `master-hv_breakers.json.txt` | reference table: hv breakers (kept whole — owner: no voltage limit on data) |
| `master-hv_breakers_extended.json.txt` | reference table: hv breakers extended (kept whole — owner: no voltage limit on data) |
| `master-ibr.json.txt` | reference table: ibr |
| `master-instrument_transformers.json.txt` | reference table: instrument transformers |
| `master-insulation_classes.json.txt` | reference table: insulation classes |
| `master-lv_breakers.json.txt` | reference table: lv breakers |
| `master-model_requirements.json.txt` | reference table: model requirements (provenance shown with records) |
| `master-motor_characteristics.json.txt` | reference table: motor characteristics |
| `master-motor_locked_rotor_codes.json.txt` | reference table: motor locked rotor codes |
| `master-motor_models.json.txt` | reference table: motor models |
| `master-motors_nameplate.json.txt` | reference table: motors nameplate |
| `master-nec_ampacity_2023.json.txt` | reference table: nec ampacity 2023 |
| `master-neutral_grounding_resistors.json.txt` | reference table: neutral grounding resistors |
| `master-overload_heaters.json.txt` | reference table: overload heaters |
| `master-protection_curves.json.txt` | reference table: protection curves |
| `master-pv_modules.json.txt` | reference table: pv modules |
| `master-pv_optimizers.json.txt` | reference table: pv optimizers |
| `master-reclosers.json.txt` | reference table: reclosers |
| `master-relays.json.txt` | reference table: relays |
| `master-source_register.json.txt` | reference table: source register (provenance shown with records) |
| `master-surge_arresters.json.txt` | reference table: surge arresters |
| `master-switchgear.json.txt` | reference table: switchgear |
| `master-terminations.json.txt` | reference table: terminations |
| `master-transformers.json.txt` | reference table: transformers |
| `master-transmission_conductors.json.txt` | overhead line conductors (also used for MV lines; owner: no voltage limit on data) |
| `master-trip_devices.json.txt` | reference table: trip devices |
| `motors_nameplate.json.txt` | motor picker (owner: keep) |
| `pv_modules.json.txt` | PV module picker (DC arrays) |
| `reclosers.json.txt` | recloser picker |
| `switchgear.json.txt` | switchgear picker |
| `transformers.json.txt` | transformer picker |

## Drop — 46 files, 2.3 MB (gzip)

| File | Reason |
|---|---|
| `master-audit_readme.json.txt` | workbook notes |
| `master-battery_performance.json.txt` | BESS charge/discharge curves (study out of scope, D-04) |
| `master-box_fill.json.txt` | Vault calculator |
| `master-cable_cleat_size_map.json.txt` | Cable_Tray calculator |
| `master-cable_cleat_sizes.json.txt` | Cable_Tray calculator |
| `master-cable_cleats.json.txt` | Cable_Tray calculator |
| `master-cable_normalization.json.txt` | import helper, duplicate of cables |
| `master-cable_planning_defaults.json.txt` | planning defaults for other calculators |
| `master-cable_tray_equipment.json.txt` | Cable_Tray calculator |
| `master-cable_trays.json.txt` | Cable_Tray calculator |
| `master-calculator_key_audit.json.txt` | audit log |
| `master-change_log.json.txt` | workbook audit log |
| `master-conduit_fire_protection.json.txt` | Cable_Tray calculator |
| `master-conduits.json.txt` | Cable_Tray calculator |
| `master-enclosures.json.txt` | Vault calculator |
| `master-equipment_record_history.json.txt` | audit log |
| `master-field_audit.json.txt` | audit log |
| `master-fire_protection.json.txt` | not electrical design scope |
| `master-ground_electrodes.json.txt` | Grounding calculator |
| `master-interruption_cost.json.txt` | cost data (financial, excluded) |
| `master-legacy_nec_reference.json.txt` | older NEC reference (D-02) |
| `master-nec_ampacity_2020.json.txt` | NEC 2023 chosen (D-02) |
| `master-nec_channel_tray_fill.json.txt` | Cable_Tray calculator |
| `master-nec_tray_fill.json.txt` | Cable_Tray calculator |
| `master-numeric_benchmarks.json.txt` | workbook test values |
| `master-optimizer_review.json.txt` | audit log |
| `master-paper_audit.json.txt` | audit log |
| `master-parts_catalog.json.txt` | accessories for other calculators |
| `master-plugin_log.json.txt` | audit log |
| `master-pv_unit_review.json.txt` | audit of PV records (duplicate of pv_modules) |
| `master-railway_loads.json.txt` | not PV scope |
| `master-record_reconciliation.json.txt` | audit log |
| `master-rectifiers.json.txt` | not PV scope |
| `master-reliability.json.txt` | reliability indices (not Group 14) |
| `master-reliability_extended.json.txt` | as above |
| `master-request_audit.json.txt` | audit log |
| `master-research_guidance.json.txt` | notes |
| `master-sheet_map.json.txt` | workbook map |
| `master-tray_accessory_rules.json.txt` | Cable_Tray |
| `master-tray_barrier_cover_codes.json.txt` | Cable_Tray |
| `master-tray_egc_area_thresholds.json.txt` | Cable_Tray |
| `master-tray_egc_metal_area.json.txt` | Cable_Tray |
| `master-tray_engineering_defaults.json.txt` | Cable_Tray |
| `master-tray_expansion_rules.json.txt` | Cable_Tray |
| `master-tray_grounding_accessories.json.txt` | Cable_Tray |
| `master-tray_width_codes.json.txt` | Cable_Tray |

## Done in Batch 2
- Drop list applied with `QA/B02_HOUSEKEEPING/db_whitelist.py` (reproducible): 65 files, 7.7 MB; 50 of 117 sheets served. No record filtering inside tables (owner, 15 Nov: no 35 kV limit on data). Package only — not live (D-08).

## Still to fix in the import
- Batch 3 (I-09): the picker copies (`cables`, `cable_impedance_defaults`, `transformers`, `ibr`, `generators`, `hv_breakers`, `lv_breakers`, `switchgear`, `motors_nameplate`, `fuses`, `reclosers`, `disconnects`, `pv_modules`, `cable-picker`) are removed: the picker and the master library both read the `master-*` file of the same sheet. The rows in the table above marked "picker" now point to their `master-*` file. Package database: 52 entries, 4.9 MB.
- Every record keeps its source citation and the database revision (Master Prompt Section 44).
- Nothing goes live before the owner approves (D-08).
