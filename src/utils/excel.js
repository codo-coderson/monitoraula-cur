import * as XLSX from 'xlsx';

export const ExcelUtils = {
  parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async function(e) {
        try {
          console.log('📊 Procesando archivo Excel...', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            isMobile: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
          });

          let workbook;
          const fileData = e.target.result;

          // Try different reading methods for maximum compatibility
          const readMethods = [
            // Method 1: Array Buffer (works best on desktop)
            async () => {
              console.log('Intentando método 1: Array Buffer');
              return XLSX.read(fileData, { type: 'array' });
            },
            // Method 2: Binary String (better for some mobile browsers)
            async () => {
              console.log('Intentando método 2: Binary String');
              return XLSX.read(fileData, { type: 'binary' });
            },
            // Method 3: Base64 (good for iOS)
            async () => {
              console.log('Intentando método 3: Base64');
              const base64 = btoa(
                new Uint8Array(fileData).reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
              return XLSX.read(base64, { type: 'base64' });
            },
            // Method 4: Raw Binary (fallback)
            async () => {
              console.log('Intentando método 4: Raw Binary');
              return XLSX.read(fileData, { type: 'string' });
            }
          ];

          // Try each method until one works
          let lastError;
          for (const method of readMethods) {
            try {
              workbook = await method();
              if (workbook && workbook.SheetNames) {
                console.log('✅ Método exitoso');
                break;
              }
            } catch (error) {
              console.warn('Método falló:', error);
              lastError = error;
              continue;
            }
          }

          if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error(
              'No se pudo leer el archivo Excel. ' +
              'Último error: ' + (lastError?.message || 'Formato no reconocido')
            );
          }
          
          console.log('📊 Hojas disponibles:', workbook.SheetNames);
          
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
          
          if (!json.length) {
            throw new Error('El archivo Excel no contiene datos');
          }
          
          // Get headers from first row and clean them
          const headers = json[0].map(h => String(h || '').trim());
          console.log('📊 Encabezados encontrados:', headers);
          
          // Map column indices with flexible matching
          const alumnoIndex = headers.findIndex(h => 
            /^(alumno|nombre|student|name)$/i.test(h)
          );
          
          const cursoIndex = headers.findIndex(h => 
            /^(curso|clase|group|class)$/i.test(h)
          );
          
          if (alumnoIndex === -1 || cursoIndex === -1) {
            throw new Error(
              `El archivo debe tener columnas "Alumno"/"Nombre" y "Curso"/"Clase".\n` +
              `Columnas encontradas: ${headers.join(', ')}`
            );
          }
          
          // Convert data rows to objects with validation
          const processedData = json.slice(1)
            .map(row => {
              // Ensure row has enough columns
              if (!row[alumnoIndex] || !row[cursoIndex]) return null;
              
              return {
                Alumno: String(row[alumnoIndex] || '').trim(),
                Curso: String(row[cursoIndex] || '').trim()
              };
            })
            .filter(row => row && row.Alumno && row.Curso); // Remove invalid rows
          
          console.log(`📊 Datos procesados: ${processedData.length} filas válidas`);
          
          if (processedData.length === 0) {
            throw new Error(
              'No se encontraron datos válidos en el archivo.\n' +
              'Asegúrate de que el archivo tiene el formato correcto y contiene datos.'
            );
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
        reject(new Error(
          'Error al leer el archivo. ' +
          'Asegúrate de que es un archivo Excel válido y no está dañado.'
        ));
      };
      
      // Start with readAsArrayBuffer for better compatibility
      reader.readAsArrayBuffer(file);
    });
  }
};