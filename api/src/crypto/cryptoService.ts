import bcrypt from "bcryptjs"

export async function bcryptHash(text: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(text, salt);
  return hash;
}

export async function bcryptCompare(text: string, hashString: string) {
    return await bcrypt.compare(text, hashString);
}