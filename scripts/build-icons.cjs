/* Generate Windows executable and window icons from the original Block4Film SVG. */
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

async function main() {
  const assets = path.join(__dirname, '..', 'app', 'assets');
  const source = path.join(assets, 'Block4Film-Icon.svg');
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngs = await Promise.all(sizes.map(size =>
    sharp(source)
      .resize(size, size, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
      .png()
      .toBuffer()
  ));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size === 256 ? 0 : size, e);
    header.writeUInt8(size === 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(pngs[i].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += pngs[i].length;
  });
  await fs.writeFile(path.join(assets, 'Block4Film.ico'), Buffer.concat([header, ...pngs]));
  await sharp(source)
    .resize(512, 512, {fit: 'contain', background: {r: 0, g: 0, b: 0, alpha: 0}})
    .png()
    .toFile(path.join(assets, 'Block4Film-Icon.png'));
  console.log('Generated Block4Film.ico and Block4Film-Icon.png');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
