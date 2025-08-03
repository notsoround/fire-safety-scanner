import React from 'react';

const InspectionAnalysis = ({ geminiResponse }) => {
  console.log('geminiResponse prop:', JSON.stringify(geminiResponse, null, 2));

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    if (typeof dateValue === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
      }
      const d = new Date(dateValue);
      return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : dateValue;
    }
    if (typeof dateValue === 'object' && dateValue !== null) {
      const { year, month, day } = dateValue;
      if (year && month && day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return 'Invalid Date';
  };

  const parseResponse = () => {
    if (typeof geminiResponse === 'object' && geminiResponse !== null) {
      return geminiResponse;
    }
    if (typeof geminiResponse === 'string') {
      try {
        const jsonMatch = geminiResponse.match(/```json\s*(\{[\s\S]*?\})\s*```|(\{[\s\S]*\})/);
        if (jsonMatch) {
          const jsonString = jsonMatch[1] || jsonMatch[2];
          return JSON.parse(jsonString);
        }
        return JSON.parse(geminiResponse);
      } catch (e) {
        return { error: 'Could not parse analysis JSON.', raw: geminiResponse };
      }
    }
    return { error: 'Invalid analysis format.' };
  };

  const analysis = parseResponse();

  if (analysis.error) {
    return <pre className="whitespace-pre-wrap text-sm">{analysis.raw || analysis.error}</pre>;
  }

  return (
    <div className="space-y-2">
      {analysis.last_inspection_date && <div><strong>Last Inspection:</strong> {formatDate(analysis.last_inspection_date)}</div>}
      {analysis.next_due_date && <div><strong>Next Due:</strong> {formatDate(analysis.next_due_date)}</div>}
      {analysis.extinguisher_type && <div><strong>Type:</strong> {analysis.extinguisher_type}</div>}
      {analysis.condition && <div><strong>Condition:</strong> {analysis.condition}</div>}
      {analysis.maintenance_notes && <div><strong>Notes:</strong> {analysis.maintenance_notes}</div>}
      {analysis.requires_attention !== undefined && (
        <div><strong>Requires Attention:</strong> {analysis.requires_attention ? 'Yes' : 'No'}</div>
      )}
    </div>
  );
};

export default InspectionAnalysis;