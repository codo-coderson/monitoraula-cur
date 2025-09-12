import * as XLSX from 'xlsx';

export const ExcelUtils = {
  parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          console.log('📊 Procesando archivo Excel...');
          const data = e.target.result;
          
          // Try reading as array buffer instead of binary string for better compatibility
          const workbook = XLSX.read(data, { type: 'array' });
          
          console.log('📊 Hojas disponibles:', workbook.SheetNames);
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('El archivo Excel está vacío o no es válido');
          }
          
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          if (!sheet) {
            throw new Error(`No se pudo leer la hoja ${sheetName}`);
          }
          
          // Convert to JSON with more options for better parsing
          const json = XLSX.utils.sheet_to_json(sheet, {
            raw: false, // Use formatted strings
            defval: '', // Default value for empty cells
            blankrows: false // Skip blank rows
          });
          
          console.log(`📊 Filas encontradas: ${json.length}`);
          
          if (!json.length) {
            throw new Error('El archivo Excel no contiene datos');
          }
          
          // Log first row to debug column names
          console.log('📊 Primera fila (muestra):', json[0]);
          console.log('📊 Columnas detectadas:', Object.keys(json[0] || {}));
          
          // Validar estructura del Excel - be more flexible with column names
          const firstRow = json[0];
          const hasAlumno = firstRow && (
            firstRow.hasOwnProperty('Alumno') || 
            firstRow.hasOwnProperty('alumno') || 
            firstRow.hasOwnProperty('ALUMNO') ||
            firstRow.hasOwnProperty('Nombre') ||
            firstRow.hasOwnProperty('nombre') ||
            firstRow.hasOwnProperty('NOMBRE')
          );
          
          const hasCurso = firstRow && (
            firstRow.hasOwnProperty('Curso') || 
            firstRow.hasOwnProperty('curso') || 
            firstRow.hasOwnProperty('CURSO') ||
            firstRow.hasOwnProperty('Clase') ||
            firstRow.hasOwnProperty('clase') ||
            firstRow.hasOwnProperty('CLASE')
          );
          
          if (!hasAlumno || !hasCurso) {
            const availableColumns = Object.keys(firstRow || {}).join(', ');
            throw new Error(
              `El archivo Excel debe tener columnas "Alumno" y "Curso".\n` +
              `Columnas encontradas: ${availableColumns || 'ninguna'}\n` +
              `Asegúrate de que la primera fila contenga los nombres de las columnas.`
            );
          }
          
          // Normalize column names to expected format
          const normalizedData = json.map(row => {
            // Find the actual column names (case-insensitive)
            let alumnoKey = Object.keys(row).find(k => 
              /^(alumno|nombre)$/i.test(k.trim())
            );
            let cursoKey = Object.keys(row).find(k => 
              /^(curso|clase)$/i.test(k.trim())
            );
            
            return {
              Alumno: row[alumnoKey] || row['Alumno'] || row['Nombre'] || '',
              Curso: row[cursoKey] || row['Curso'] || row['Clase'] || ''
            };
          }).filter(row => row.Alumno && row.Curso); // Filter out empty rows
          
          console.log(`📊 Datos normalizados: ${normalizedData.length} filas válidas`);
          
          if (normalizedData.length === 0) {
            throw new Error('No se encontraron datos válidos después de procesar el archivo');
          }
          
          resolve(normalizedData);
        } catch (error) {
          console.error('❌ Error procesando Excel:', error);
          reject(error);
        }
      };
      
      reader.onerror = function(error) {
        console.error('❌ Error leyendo archivo:', error);
        reject(new Error('Error al leer el archivo. Asegúrate de que es un archivo Excel válido.'));
      };
      
      // Read as ArrayBuffer for better compatibility
      reader.readAsArrayBuffer(file);
    });
  }
};