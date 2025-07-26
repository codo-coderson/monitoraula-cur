import * as XLSX from 'xlsx';

export const ExcelUtils = {
  parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet);
          
          // Validar estructura del Excel
          if (!json.length || !json[0].hasOwnProperty('Alumno') || !json[0].hasOwnProperty('Curso')) {
            throw new Error('El archivo Excel debe tener columnas "Alumno" y "Curso"');
          }
          
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
      
      reader.readAsBinaryString(file);
    });
  }
}; 