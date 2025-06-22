import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';

const filePath = path.join(process.cwd(), 'lib', 'users.json');

export async function getAllUsers() {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

export async function addUser({ name, email, password, role }) {
  const users = await getAllUsers();
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), name, email, password: hashedPassword, role };
  users.push(newUser);
  await fs.writeFile(filePath, JSON.stringify(users, null, 2));
  return newUser;
}

export async function findUserByEmail(email) {
  const users = await getAllUsers();
  return users.find(u => u.email === email);
}
