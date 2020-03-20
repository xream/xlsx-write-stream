import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

export const tmpFolderPath = path.resolve('./test/.tmp');

/**
 * Ensure tmp folder is created
 */
export const initialize = () => {
  fs.mkdirSync(tmpFolderPath, { recursive: true });
};

/**
 * Ensure tmp folder is removed
 */
export const clean = () => {
  rimraf.sync(tmpFolderPath);
};
