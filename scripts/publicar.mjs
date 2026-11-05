import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";

function leerEnv(path) {
  const valores = {};
  for (const linea of readFileSync(path, "utf8").split("\n")) {
    const limpio = linea.trim();
    if (!limpio || limpio.startsWith("#")) continue;
    const corte = limpio.indexOf("=");
    if (corte < 1) continue;
    let valor = limpio.slice(corte + 1).trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    valores[limpio.slice(0, corte).trim()] = valor;
  }
  return valores;
}

if (!existsSync(".env")) {
  console.error("Falta .env con FTP_HOST, FTP_USER, FTP_PASSWORD y EXTRACT_URL.");
  process.exit(1);
}

const env = leerEnv(".env");
for (const clave of ["FTP_HOST", "FTP_USER", "FTP_PASSWORD", "EXTRACT_URL"]) {
  if (!env[clave]) {
    console.error(`Falta ${clave} en .env`);
    process.exit(1);
  }
}

const build = spawnSync("node", ["scripts/build-dist.mjs"], { stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

if (existsSync("Archive.zip")) rmSync("Archive.zip");
const zip = spawnSync("zip", ["-r", "-q", "../Archive.zip", "."], { cwd: "dist", stdio: "inherit" });
if (zip.status !== 0) process.exit(zip.status ?? 1);

const codigo = `
import ssl
from ftplib import FTP, FTP_TLS
import os
host = os.environ["FTP_HOST"]
user = os.environ["FTP_USER"]
password = os.environ["FTP_PASSWORD"]
port = int(os.environ.get("FTP_PORT") or "21")
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.minimum_version = ssl.TLSVersion.TLSv1_2
ctx.maximum_version = ssl.TLSVersion.TLSv1_2
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

class FTP_CPanel(FTP_TLS):
    def ntransfercmd(self, cmd, rest=None):
        conn, size = FTP.ntransfercmd(self, cmd, rest)
        if self._prot_p:
            conn = self.context.wrap_socket(conn, server_hostname=self.host, session=self.sock.session)
        return conn, size

ftp = FTP_CPanel(context=ctx)
ftp.connect(host, port, timeout=60)
ftp.auth()
ftp.login(user, password)
ftp.prot_p()
ftp.set_pasv(True)
print("DIR", ftp.pwd())
nombres = [nombre for nombre in ftp.nlst() if nombre not in (".", "..")]
print("LISTA", " ".join(nombres[:80]))
if "extract.php" not in nombres:
    for candidato in ("public_html", "actasdeproclamacion.siadeg.com", "httpdocs", "www"):
        if candidato in nombres:
            ftp.cwd(candidato)
            print("CWD", ftp.pwd())
            break
with open("Archive.zip", "rb") as archivo:
    ftp.storbinary("STOR Archive.zip", archivo)
print("SUBIDO", ftp.size("Archive.zip"))
ftp.quit()
`;

const subida = spawnSync("python3", ["-c", codigo], {
  stdio: "inherit",
  env: { ...process.env, ...env },
});
if (subida.status !== 0) process.exit(subida.status ?? 1);

const respuesta = await fetch(env.EXTRACT_URL);
const texto = await respuesta.text();
console.log("EXTRACT", respuesta.status);
console.log(texto.slice(0, 2000));
if (!respuesta.ok) process.exit(1);
