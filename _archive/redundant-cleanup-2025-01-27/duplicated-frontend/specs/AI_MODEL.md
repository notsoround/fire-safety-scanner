# AI Model Specification: Fire Extinguisher Tag Analysis

## 1. High-Level Goal

To automatically, accurately, and rapidly extract structured data from an image of a fire extinguisher inspection tag. The primary output must be machine-readable and sufficient for triggering compliance and lead-generation workflows.

---

## 2. Model & Endpoint

*   **Model:** `openrouter/google/gemini-2.5-pro`
*   **Provider:** OpenRouter
*   **API:** `litellm.acompletion`

---

## 3. Input & Output

*   **Input:** A single image file (e.g., JPEG, PNG, HEIC) containing a clear view of an inspection tag. The image will be provided as a Base64 encoded string.
*   **Output:** A structured JSON object.

---

## 4. System Prompt

```
You are an expert fire safety inspector. Analyze fire extinguisher inspection tags and extract the following information.

Please provide the response in JSON format. If any date information is unclear or missing, indicate this in your response.
```

## 5. JSON Output Schema (Target)

The model should return a JSON object with the following structure.

*   `last_inspection_date`: (Object) The most recent date an inspection was performed.
    *   `year`: (Integer)
    *   `month`: (Integer)
    *   `day`: (Integer)
    *   `extracted_text`: (String) The exact text from which the date was inferred.
*   `next_due_date`: (Object) The date the next inspection is due.
    *   `year`: (Integer)
    *   `month`: (Integer)
    *   `day`: (Integer)
    *   `extracted_text`: (String) The exact text from which the date was inferred.
*   `extinguisher_type`: (String) The type of extinguisher (e.g., "ABC", "CO2", "Class K").
*   `condition`: (String) The overall condition of the unit ("Good", "Fair", "Poor").
*   `requires_attention`: (Boolean) `true` if the tag indicates an issue requiring follow-up.
*   `maintenance_notes`: (String) Any specific notes regarding repairs, pressure, or condition.
*   `confidence_score`: (Float) A score from 0.0 to 1.0 indicating the model's confidence in the accuracy of the extracted data.
*   `raw_text_analysis`: (String) Full OCR text extracted from the tag for debugging purposes.


### Example JSON Output:
```json
{
  "last_inspection_date": {
    "year": 2024,
    "month": 8,
    "day": 15,
    "extracted_text": "Aug 2024, Day 15"
  },
  "next_due_date": {
    "year": 2025,
    "month": 8,
    "day": 15,
    "extracted_text": "Due Aug 2025"
  },
  "extinguisher_type": "ABC",
  "condition": "Good",
  "requires_attention": false,
  "maintenance_notes": "No issues noted.",
  "confidence_score": 0.92,
  "raw_text_analysis": "Full text OCR'd from the tag for debugging purposes."
}
---

## 6. Core Requirements & Success Criteria

This is the checklist for what "success" looks like for the AI model.

*   **(REQ-AI-001)** The model must correctly identify punched holes for Year, Month, and Day.
*   **(REQ-AI-002)** The model must be able to read printed or handwritten dates as a fallback if no holes are present.
*   **(REQ-AI-003)** The model must identify common extinguisher types (e.g., ABC, CO2, Class K, Water, Foam). If none is found, it must return "Unknown".
*   **(REQ-AI-004)** The model must infer if the extinguisher `requires_attention` is `true` based on keywords like "recharge," "service," "replace," or a "Poor" condition assessment.
*   **(REQ-AI-005)** If any key field (Year, Month) cannot be determined, it must be returned as `null` and the `confidence_score` should be lowered significantly.
*   **(REQ-AI-006)** The entire AI analysis process, from API call to response, should ideally complete in under 5 seconds to ensure a good user experience for the technician in the field.

---

## 7. (Advanced) Layered Analysis Strategy

To improve accuracy, a chained or layered LLM analysis approach will be implemented on the backend. This breaks the complex task into simpler, specialized steps.

1.  **Layer 1: OCR & Text Extraction:**
    *   **Goal:** Perform Optical Character Recognition to get all visible text from the image.
    *   **Model:** A vision model optimized for OCR.

2.  **Layer 2: Date Component Analysis (Parallel):**
    *   **Prompt A (Year):** "From the following text and image, find the punched or written **year** for the last inspection."
    *   **Prompt B (Month):** "From the following text and image, find the punched or written **month** for the last inspection."
    *   **Prompt C (Day):** "From the following text and image, find the punched or written **day** for the last inspection."

3.  **Layer 3: Categorical Analysis (Parallel):**
    *   **Prompt D (Type):** "From the text, what is the extinguisher **type** (ABC, CO2, etc.)?"
    *   **Prompt E (Condition):** "From the text, assess the **condition** (Good, Fair, Poor)."

4.  **Layer 4: Final Consolidation & Reasoning:**
    *   **Goal:** Take the outputs from all previous layers and assemble them into the final, structured JSON object as defined in the schema.
    *   **Logic:** This final layer acts as a reasoning agent. It calculates the `next_due_date` (typically +1 year from last inspection), determines the `requires_attention` flag based on inputs, and generates a final `confidence_score`.
