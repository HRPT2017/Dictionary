// src/utils/fileSystem.ts
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export const saveFile = async (fileName: string, data: string) => {
  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: data,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return result.uri;
  } catch (e) {
    console.error('Unable to save file', e);
  }
};

export const readFile = async (fileName: string) => {
  try {
    const contents = await Filesystem.readFile({
      path: fileName,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return contents.data;
  } catch (e) {
    console.error('Unable to read file', e);
  }
};
