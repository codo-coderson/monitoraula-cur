import * as XLSX from 'xlsx';

export const ExcelUtils = {
  parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          console.log('📊 Procesando archivo Excel...');
          const fileData = e.target.result;
          
          // Configure XLSX to be more tolerant of different file formats
          const options = {
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          };

          // For mobile Safari compatibility
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            options.type = 'base64';
          }
          
          let workbook;
          try {
            workbook = XLSX.read(fileData, options);
          } catch (readError) {
            console.error('Error en primera lectura, intentando alternativa:', readError);
            // Try alternative reading method for mobile
            workbook = XLSX.read(btoa(fileData), { type: 'base64' });
          }
          
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
            blankrows: false, // Skip blank rows
            header: 1 // Generate headers from first row
          });
          
          console.log(`📊 Filas encontradas: ${json.length}`);
          
          if (!json.length) {
            throw new Error('El archivo Excel no contiene datos');
          }
          
          // Get headers from first row
          const headers = json[0].map(h => String(h).trim());
          console.log('📊 Encabezados encontrados:', headers);
          
          // Map column indices
          const alumnoIndex = headers.findIndex(h => 
            /^(alumno|nombre)$/i.test(h)
          );
          
          const cursoIndex = headers.findIndex(h => 
            /^(curso|clase)$/i.test(h)
          );
          
          if (alumnoIndex === -1 || cursoIndex === -1) {
            throw new Error(
              `El archivo debe tener columnas "Alumno"/"Nombre" y "Curso"/"Clase".\n` +
              `Columnas encontradas: ${headers.join(', ')}`
            );
          }
          
          // Convert data rows to objects
          const processedData = json.slice(1).map(row => ({
            Alumno: String(row[alumnoIndex] || '').trim(),
            Curso: String(row[cursoIndex] || '').trim()
          })).filter(row => row.Alumno && row.Curso);
          
          console.log(`📊 Datos procesados: ${processedData.length} filas válidas`);
          
          if (processedData.length === 0) {
            throw new Error('No se encontraron datos válidos en el archivo');
          }
          
          resolve(processedData);
        } catch (error) {
          console.error('❌ Error procesando Excel:', error);
          reject(new Error(
            'Error al procesar el archivo Excel. ' +
            'Asegúrate de que es un archivo válido y contiene las columnas correctas.\n\n' +
            error.message
          ));
        }
      };
      
      reader.onerror = function(error) {
        console.error('❌ Error leyendo archivo:', error);
        reject(new Error('Error al leer el archivo. Asegúrate de que es un archivo Excel válido.'));
      };
      
      try {
        // Try to read as ArrayBuffer first
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.warn('⚠️ Error con ArrayBuffer, intentando como texto binario:', error);
        // Fallback for mobile browsers
        reader.readAsBinaryString(file);
      }
    });
  }
};