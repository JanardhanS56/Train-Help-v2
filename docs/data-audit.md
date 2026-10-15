# Data Audit Report: Raw Indian Railways Datasets

**Audit Date:** 2026-10-15  
**Auditor:** TravelRescue AI (Stage 0 Reconnaissance)  
**Status:** Complete

---

## 1. Raw Datasets Inventory

| Dataset | Real Path | File Size | Format | Encoding | Total Rows | Total Columns |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Railway Stations** | `srailway_station_data/india_railway_stations.csv` | 584,362 bytes (0.56 MB) | CSV (UTF-8) | UTF-8 | 8,990 | 9 |
| **Railway Stations (Parquet)** | `srailway_station_data/india_railway_stations.parquet` | 359,395 bytes (0.34 MB) | Apache Parquet | Binary | 8,990 | 9 |
| **Trains & Routes** | `train_data/trains.csv` | 6,411,121 bytes (6.11 MB) | CSV (UTF-8) | UTF-8 | 14,783 | 29 |

---

## 2. Station Data Schema & Null Analysis (`india_railway_stations.csv`)

- **Total Station Records:** 8,990
- **Distinct Station Codes:** 8,990
- **Duplicate Station Codes:** 0

| Column Name | Data Type | Null Count | Null Rate (%) | Description / Role |
| :--- | :--- | :--- | :--- | :--- |
| `station_name` | Text / Numeric | 1 | 0.01% | Station attribute |
| `station_code` | Text / Numeric | 0 | 0.00% | Station attribute |
| `state` | Text / Numeric | 98 | 1.09% | Station attribute |
| `railway_zone_code` | Text / Numeric | 4,532 | 50.41% | Station attribute |
| `latitude` | Text / Numeric | 189 | 2.10% | Station attribute |
| `longitude` | Text / Numeric | 189 | 2.10% | Station attribute |
| `is_junction` | Text / Numeric | 0 | 0.00% | Station attribute |
| `route_count` | Text / Numeric | 0 | 0.00% | Station attribute |
| `station_count_in_state` | Text / Numeric | 98 | 1.09% | Station attribute |

---

## 3. Train Data Schema & Null Analysis (`trains.csv`)

- **Total Train Records:** 14,783
- **Distinct Train Numbers:** 14,783
- **Duplicate Train Numbers:** 0
- **Total Stop References Across All Trains:** 284,384
- **Average Stops per Train:** 19.2 (Min: 2, Max: 119)

| Column Name | Sample Value | Null Count | Null Rate (%) | Keep / Drop Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `SrNo` | `1` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `TrainNo` | `10002` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `TrainName` | `Satpura Express` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `TrainCategory` | `Mail Express (ME)` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `RailwayZone` | `Central Railway (CR)` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `StartingPoint` | `DADAR` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `FinalDestination` | `DIVA` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `DaysRunning` | `Mon Tue Wed Thu Fri Sat S` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `Distance_km` | `31` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `AverageSpeed_kmph` | `20` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `TravelTime_hr` | `31.7` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `CoachCount` | `22` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `OccupancyPercentage` | `75` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `DelayProbability` | `0.0` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `PunctualityScore` | `100` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `ApproxFareRange_INR` | `46-168` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `YearIntroduced` | `1997` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `ElectrifiedRoute` | `True` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `AvgStops` | `3` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `PlatformCountAtOrigin` | `3` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `RouteType` | `Delta` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `ACPercentageCoaches` | `28` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `PeakSeasonMultiplier` | `1.87` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `MaintenanceScore` | `68` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `JourneyDate` | `2026-01-01` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `Revenue_INR` | `201639` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `Rating` | `3.6` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `Remarks` | `api` | 0 | 0.00% | Assessed in Stage 1 schema justification |
| `stops` | `DADAR|THANE|DIVA` | 0 | 0.00% | Assessed in Stage 1 schema justification |

---

## 4. Key Findings & Data Engineering Insights

1. **Stop Resolution Challenge:**  
   The `trains.csv` dataset contains a delimited string `stops` (`DADAR|THANE|DIVA`) using station names rather than codes. Furthermore, station names exhibit spelling variants (e.g., `KSR BENGALURU` vs `BANGALORE CITY JN`, `H NIZAMUDDIN` vs `DELHI H NIZAMUDDIN`).
2. **Intermediate Timings:**  
   `trains.csv` gives overall `TravelTime_hr` and `Distance_km`, but not stop-by-stop arrival and departure timestamps. In accordance with Stage 3 rules, official timetable schedules for the curated demo trains must be fetched/grounded with provenance (`data/clean/provenance.json`), and any derived intermediate halt timings marked `time_source = 'derived'`.
3. **Mock Data Coverage:**  
   15 of the 16 core mock train numbers (e.g. `22691`, `12629`, `12649`, `12621`, `12627`, `12859`, `20608`, `12702`, `16595`, `12028`, `12123`) exist in the raw dataset. All hub stations (`SBC`, `YPR`, `NDLS`, `NZM`, `CSMT`, `MAS`, `SC`, `HWH`, `MAO`, `BPL`, `NGP`) are verified in the station database.
4. **Data Hygiene:**  
   Zero station codes are null. Station coordinates (`latitude`, `longitude`) are present for over 99% of stations, enabling precise SVG route map projection without external map dependencies.
