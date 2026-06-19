import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import mongoose, { Types } from 'mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { randomInt } from 'crypto';
import { Method } from 'libs/utils/constants';

export const getHashPassword = (password: string) => {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);
  return hash;
};

export const isValidPassword = (password: string, hash: string) => {
  return compareSync(password, hash);
};

export const isValidMongoId = (id: string) =>
  mongoose.Types.ObjectId.isValid(id) &&
  new mongoose.Types.ObjectId(id).toString() === id;

export const downloadSocialImage = async (url: string, email: string) => {
  const folder = path.join(
    process.cwd(),
    'apps/api-gateway/public/images/user',
  );

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  const safeEmail = email.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${safeEmail}.jpg`;
  const filePath = path.join(folder, fileName);

  const response = await axios({
    url,
    method: Method.GET,
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  await new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return fileName;
};

export const generateOtp = () => {
  return randomInt(100000, 1000000).toString();
};

export const toObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
  if (id instanceof Types.ObjectId) return id;
  return new Types.ObjectId(id);
};
