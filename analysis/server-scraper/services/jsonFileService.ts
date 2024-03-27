import * as fs from 'fs';
import * as path from 'path';

export function getDateString() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
  const day = currentDate.getDate().toString().padStart(2, '0');
  const dateSting = `${year}-${month}-${day}`;
  return dateSting;
}

export const saveJSONData = async (
  serverData: Record<string, any>,
  saveDirectory: string,
): Promise<string> => {
  // make sure the output directory exists
  if (!fs.existsSync(saveDirectory)) {
    fs.mkdirSync(saveDirectory, { recursive: true });
  }
  const dateSting = getDateString();

  const saveDirectoryWithDate = saveDirectory + '/' + dateSting + '/';
  const filenameWithDate = path.join(
    saveDirectoryWithDate,
    sanitizeFilename(serverData['serverName']) + '-' + dateSting + '.json',
  );
  fs.writeFileSync(filenameWithDate, JSON.stringify(serverData, null, 2));
  console.log(`Saved JSON data to ${filenameWithDate}`);
  return filenameWithDate;
};

const sanitizeFilename = (input: string): string => {
  return input.replace(/[^a-zA-Z0-9]/g, '_');
};
