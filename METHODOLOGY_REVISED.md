# Methodology (Revised for Submission)

## First: Case Data Collection and Processing

A systematic approach was used to collect and organize published sarcoidosis cases to identify clinical patterns and diagnostic challenges, with the purpose of shortening the time to diagnosis by increasing early clinical suspicion of the disease.

This systematic approach began with public scientific sources: confirmed sarcoidosis cases and look-alike non-sarcoidosis cases were extracted from PubMed and Google Scholar using the search queries `"sarcoidosis case report"`, `"sarcoidosis patient history"`, and `"sarcoidosis review"`. Specific selection criteria were applied to identify eligible case reports, recording for each patient:
- Patient history and age
- Presenting symptoms across body systems
- Initial physical examination findings
- Laboratory and imaging test results
- Time to diagnosis (in months)
- Final confirmed disease (confirmed sarcoidosis vs. look-alike disease, to test the model on both)

From an initial cohort of **30 published cases** (**19 confirmed sarcoidosis** and **11 look-alike cases**), recurring symptoms, examination findings, and laboratory tests were identified and grouped as shown in **Fig. (1)** and **Fig. (2)**. Each variable was structured in a standardized format for the points-based scoring model: binary (**yes / no**) for symptoms and clinical findings, and **numerical values** (compared against normal reference ranges) for laboratory tests, age, and time to diagnosis.

> **[Insert Fig. (1): Patient Symptoms Hierarchy Diagram]**
> *Fig. (1): Categorization of patient symptoms across body systems in the 30-case sample.*

> **[Insert Fig. (2): Examinations and Tests Hierarchy Diagram]**
> *Fig. (2): Categorization of imaging, biopsy, cardiac, and laboratory investigations in the 30-case sample.*

---

## Second: Points-Based Clinical Scoring Model

The system supports earlier clinical suspicion of sarcoidosis by evaluating structured patient findings through a transparent **points-based scoring model**.

The scoring model processes standardized clinical inputs organized in the case dataset:
- **Case number, age, and time to diagnosis:** recorded as numerical values.
- **Symptoms and clinical/imaging findings:** organized by body system, with each individual finding recorded as a binary (`yes` or `no`) value.
- **Laboratory test values:** recorded as numerical values and compared against standard clinical reference ranges.

The dataset is expandable, allowing newly reviewed patient cases to be imported via Excel/CSV sheets so the team can regenerate and refine the model parameters over time.

The points-based scoring model evaluates patient data according to two factors:
1. **Prevalence in sarcoidosis vs. look-alike cases:** how frequently each symptom or finding appeared in confirmed sarcoidosis cases compared with look-alike diseases (**Fig. (3)**).
2. **Clinical weighting and laboratory severity:**
   - **Symptoms and findings** are assigned points from **−2 to +5** (**Fig. (4)**). Findings typical of sarcoidosis (such as bilateral hilar lymphadenopathy on chest imaging, dry cough, or skin lesions) receive positive points, whereas findings more typical of look-alike diseases such as tuberculosis or lymphoma (such as night sweats) receive negative points.
   - **Laboratory tests** earn points when outside their normal reference range (**Table (1)**): up to `1.5×` the abnormal limit awards `1/3` of the test's maximum points, `1.5–2×` awards `2/3`, and more than `2×` awards full points.
   - **Probability conversion:** Starting from a **10% base pretest probability**, every **2 points doubles the odds** of sarcoidosis (capped at 99%), returning a likelihood percentage (`Low <30%`, `Moderate 30–60%`, `High ≥60%`) along with an item-by-item point breakdown.

> **[Insert Fig. (3): Most Frequent Findings in Sarcoidosis Bar Chart]**
> *Fig. (3): Most frequent clinical and imaging findings among confirmed sarcoidosis patients (out of 19 cases).*

> **[Insert Fig. (4): Points per Finding Chart]**
> *Fig. (4): Point weights assigned to each clinical and imaging finding in the points-based scoring model.*

### Table (1): Laboratory Reference Ranges and Maximum Points

| Laboratory Test | Normal Range | Unit | Scored Direction | Max Points |
| :--- | :--- | :--- | :--- | :--- |
| **ACE** | 8 – 52 | U/L | Elevated (`> 52 U/L`) | +5 |
| **Serum calcium** | 8.5 – 10.5 | mg/dL | Elevated (`> 10.5 mg/dL`) | +4 |
| **Lymphocyte count** | 1.0 – 4.8 | ×10³/µL | Reduced (`< 1.0 ×10³/µL`) | +2 |
| **ALP** | 44 – 147 | U/L | Elevated (`> 147 U/L`) | +2 |
| **CRP** | 0 – 5 | mg/L | Elevated (`> 5 mg/L`) | +1 |
| **ESR** | 0 – 20 | mm/hr | Elevated (`> 20 mm/hr`) | +1 |
| **LDH** | 140 – 280 | U/L | Elevated (`> 280 U/L`) | +1 |
| **WBC** | 4.0 – 11.0 | ×10³/µL | Elevated (`> 11.0 ×10³/µL`) | +1 |

---

## Third: Platform Design and Architecture

The **Sarcoidosis Clinical Decision Support Platform** serves as the clinical interface through which doctors and researchers interact with the points-based scoring model. The full platform architecture is structured around **four user roles** (**Administrator, Doctor, Researcher, and Patient**) and five core modules (**Dashboard, Create & Review Case, Patient Profile, Research & Insights, and System Management**), alongside a patient-facing **My Health** view.

### Key Modules

#### 1. Dashboard (**Fig. (5)**)
Provides doctors and administrators with:
- **Find patient:** Search patient records by unique identifiers (Full Name, Patient ID, or National ID).
- **Latest patient files:** Browse and filter recent patient cases and health records.
- **Recently opened:** One-click access to recently reviewed files.
- **Alert and follow-up:** Monitor high-risk cases (patients whose latest likelihood level is **High**).

> **[Insert Fig. (5): Dashboard Module Diagram]**
> *Fig. (5): Dashboard workflow for searching, filtering, and monitoring high-risk cases.*

#### 2. Create and Review Case (**Fig. (6)**)
Divided into two workflows for doctors and administrators:
- **New Patient File:** Created with full name, national ID, date of birth, gender, phone number, and medical history summary.
- **Temporary File:** Created with a label or name, gender, approximate age, and clinical notes (for quick consultations without a national ID).
- After creating or opening a file, the doctor ticks presenting symptoms and enters laboratory values to compute and record the patient's sarcoidosis likelihood score.

> **[Insert Fig. (6): Create and Review Case Diagram]**
> *Fig. (6): New Patient File and Temporary File creation workflows.*

#### 3. Research and Insights (**Fig. (7)**)
Designed for researchers and administrators to analyze cohort data and submit new cases for model updates:
- **Model Insights & Data Import:** Researchers can upload structured case files (Excel/CSV) into a review queue so approved cases can be incorporated into future versions of the scoring model.
- **Patient Case View:** Displays de-identified research fields (ID, source, age, gender, symptoms, investigations, confirmed disease, and score).

> **[Insert Fig. (7): Research and Insights Module Diagram]**
> *Fig. (7): Research data import and case exploration module.*

#### 4. System Management (**Fig. (8)**)
Provides administrators with five management functions:
1. **User Account & Role Management:** View users, create accounts, update roles, or remove accounts.
2. **Medical List Management:** Manage clinical lists of symptoms, investigations, specialties, and confirmed diseases.
3. **Reference Data & Scoring Model:** View and propose updates to laboratory normal ranges and point weights.
4. **Audit Trail & Action Logs:** Review the latest 200 system changes (timestamp, user, and action).
5. **System Backup & Restore:** Manage scheduled database backups and restore points.

> **[Insert Fig. (8): System Management Module Diagram]**
> *Fig. (8): Five administrative subsections in System Management.*

---

### Role Permissions Matrix

Each of the **four user roles** is assigned specific module permissions, as shown in **Table (2)** (`Y` = accessible, `N` = not accessible):

### Table (2): Role-Based Access Permissions Across the Four User Roles

| Feature / Module | Admin | Doctor | Researcher | Patient |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard** | Y | Y | N | N |
| **Create & Review Case** | Y | Y | N | N |
| **Patient Profile** | Y | Y | N | N |
| **Research & Insights** | Y | N | Y | N |
| **System Management** | Y | N | N | N |
| **My Health** | N | N | N | Y *(own records only)* |

- **Doctor view in Patient Profile:** Displays the patient overview (with editable demographics and a button to add a new clinical visit), medical history summary, current symptoms from the latest visit, latest investigations and lab tests, doctor-recorded diagnosis, and score history with visit-to-visit comparison.
- **Patient view in My Health:** Allows a patient to view only their own uploaded scans and laboratory test results.

---

## Graphical Summary: The Camera Analogy

As illustrated in **Fig. (9)**, the three pillars of the project fit together like taking a photograph:
1. **Research is the Scene:** Published clinical studies and case reports provide the real-world clinical evidence on which the project is built.
2. **The Scoring Model is the Lens:** The points-based scoring model focuses and processes the patient's symptoms and laboratory findings to estimate the likelihood of sarcoidosis.
3. **The Platform is the Photograph:** The web interface presents the resulting likelihood percentage and point-by-point explanation in a clear, usable format for the doctor.

> **[Insert Fig. (9): Camera Analogy Diagram]**
> *Fig. (9): Graphical summary connecting Research (the scene), the Points-Based Scoring Model (the lens), and the Clinical Platform (the photograph).*
